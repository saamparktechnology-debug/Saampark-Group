const pool = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/passwordHash');
const { generateToken } = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const {
  sendPasswordResetOTP,
  sendEmailVerificationOTP,
  sendWelcomeEmail,
  verifyOTP,
} = require('../utils/emailService');

async function ensureUsersColumns() {
  try {
    await pool.execute('ALTER TABLE users ADD COLUMN username VARCHAR(100) NULL').catch(() => {});
    await pool.execute('ALTER TABLE users ADD COLUMN avatar_url TEXT NULL').catch(() => {});
    await pool.execute('ALTER TABLE users ADD COLUMN sub_branch_id INT NULL').catch(() => {});
    await pool.execute('ALTER TABLE users ADD COLUMN company_ids TEXT NULL').catch(() => {});
    await pool.execute('ALTER TABLE users ADD COLUMN pin_hash VARCHAR(255) NULL').catch(() => {});
    await pool.execute('ALTER TABLE users ADD COLUMN pin_setup_completed TINYINT(1) DEFAULT 0').catch(() => {});
  } catch {}
}
ensureUsersColumns();

function validatePasswordPolicy(password) {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter (A-Z).';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter (a-z).';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number (0-9).';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least one special character (!@#$%^&* etc.).';
  }
  return null;
}

// ─── REGISTER ────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { full_name, name, email, password, phone, role_id, role } = req.body;
    const displayName = full_name || name;

    if (!displayName || !email || !password) {
      return errorResponse(res, 400, 'Name, email and password are required.');
    }

    const normEmail = email.toLowerCase().trim();

    // Check if user already exists
    const [existingUsers] = await pool.execute('SELECT id, is_verified, deleted_at FROM users WHERE email = ?', [normEmail]);
    if (existingUsers.length > 0) {
      if (existingUsers[0].deleted_at) {
        // Re-activate soft-deleted user
        const hashedPassword = await hashPassword(password);
        await pool.execute(
          'UPDATE users SET full_name = ?, password_hash = ?, phone = ?, is_verified = 1, status = "active", deleted_at = NULL, updated_at = NOW() WHERE id = ?',
          [displayName, hashedPassword, phone || null, existingUsers[0].id]
        );
        await pool.execute('DELETE FROM deleted_items WHERE item_id = ? AND module_name = "users"', [normEmail]);
        return successResponse(res, 200, 'Account successfully restored and updated! You can now log in.', { email: normEmail, userId: existingUsers[0].id });
      }
      if (!existingUsers[0].is_verified) {
        // Resend verification OTP
        await sendEmailVerificationOTP(normEmail, displayName);
        return successResponse(res, 200, 'Account already exists but not verified. A new OTP has been sent to your email.', { requiresVerification: true, email: normEmail });
      }
      return errorResponse(res, 400, 'An account with this email already exists.');
    }

    // Map role string to role_id (1: Super Admin, 2: Admin, 3: Teams, 4: Clients)
    let targetRoleId = 3;
    if (role_id) {
      targetRoleId = parseInt(role_id, 10);
    } else if (role) {
      const rLower = String(role).toLowerCase().trim();
      if (rLower.includes('super')) targetRoleId = 1;
      else if (rLower.includes('admin')) targetRoleId = 2;
      else if (rLower.includes('client')) targetRoleId = 4;
      else targetRoleId = 3;
    }

    // Guard: Public registration cannot create Super Admin (1) or Admin (2)
    if (targetRoleId === 1 || targetRoleId === 2) {
      targetRoleId = 3; // Default to Teams
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Admin created/registered users with explicit role are verified by default
    const [result] = await pool.execute(
      'INSERT INTO users (role_id, full_name, email, password_hash, phone, is_verified, status) VALUES (?, ?, ?, ?, ?, 1, ?)',
      [targetRoleId, displayName, normEmail, hashedPassword, phone || null, 'active']
    );

    const userId = result.insertId;

    // Send verification email
    try {
      await sendEmailVerificationOTP(email, full_name);
    } catch (emailErr) {
      console.warn('Email send warning (account still created):', emailErr.message);
    }

    return successResponse(res, 201, 'Account created! Please check your email for a 6-digit OTP to verify your account.', {
      requiresVerification: true,
      email: email.toLowerCase(),
      userId,
    });
  } catch (error) {
    next(error);
  }
};

// ─── VERIFY EMAIL OTP ─────────────────────────────────────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return errorResponse(res, 400, 'Email and OTP are required.');

    const result = verifyOTP(email.toLowerCase(), otp, 'verify');
    if (!result.valid) return errorResponse(res, 400, result.error);

    // Mark user as verified
    await pool.execute('UPDATE users SET is_verified = 1 WHERE email = ?', [email.toLowerCase()]);

    // Fetch user details for welcome email
    const [users] = await pool.execute(
      'SELECT u.full_name, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?',
      [email.toLowerCase()]
    );

    if (users.length > 0) {
      try {
        await sendWelcomeEmail(email, users[0].full_name, users[0].role_name);
      } catch (emailErr) {
        console.warn('Welcome email warning:', emailErr.message);
      }
    }

    return successResponse(res, 200, 'Email verified successfully! You can now log in.');
  } catch (error) {
    next(error);
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const identifier = (email || username || '').toLowerCase().replace(/^@/, '').trim();

    if (!identifier || !password) {
      return errorResponse(res, 400, 'Email/Username and password are required.');
    }

    let users = [];
    try {
      [users] = await pool.execute(
        `SELECT u.*, COALESCE(r.name, 'Teams') as role_name 
         FROM users u 
         LEFT JOIN roles r ON u.role_id = r.id 
         WHERE (LOWER(u.email) = ? OR LOWER(COALESCE(u.username, '')) = ?) AND u.deleted_at IS NULL`,
        [identifier, identifier]
      );
    } catch (dbErr) {
      if (dbErr.code === 'ER_BAD_FIELD_ERROR' && (dbErr.message.includes('username') || dbErr.sqlMessage?.includes('username'))) {
        [users] = await pool.execute(
          `SELECT u.*, COALESCE(r.name, 'Teams') as role_name 
           FROM users u 
           LEFT JOIN roles r ON u.role_id = r.id 
           WHERE LOWER(u.email) = ? AND u.deleted_at IS NULL`,
          [identifier]
        );
      } else {
        throw dbErr;
      }
    }

    if (users.length === 0) {
      // Check if user exists in database but has deleted_at set (re-created or reactivated)
      let softDeleted = [];
      try {
        [softDeleted] = await pool.execute(
          `SELECT u.*, COALESCE(r.name, 'Teams') as role_name 
           FROM users u 
           LEFT JOIN roles r ON u.role_id = r.id 
           WHERE (LOWER(u.email) = ? OR LOWER(COALESCE(u.username, '')) = ?)`,
          [identifier, identifier]
        );
      } catch (dbErr) {
        if (dbErr.code === 'ER_BAD_FIELD_ERROR' && (dbErr.message.includes('username') || dbErr.sqlMessage?.includes('username'))) {
          [softDeleted] = await pool.execute(
            `SELECT u.*, COALESCE(r.name, 'Teams') as role_name 
             FROM users u 
             LEFT JOIN roles r ON u.role_id = r.id 
             WHERE LOWER(u.email) = ?`,
            [identifier]
          );
        } else {
          throw dbErr;
        }
      }

      if (softDeleted.length > 0) {
        const candidate = softDeleted[0];
        if (candidate.deleted_at || (candidate.status && candidate.status.toLowerCase() === 'inactive')) {
          return errorResponse(res, 403, 'Your account has been deactivated or deleted. Please contact your administrator.');
        }
      } else {
        // Fallback check in app_data JSON users store
        try {
          const [appDataRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "users"');
          if (appDataRows.length > 0) {
            const list = JSON.parse(appDataRows[0].data_json);
            if (Array.isArray(list)) {
              const matched = list.find((u) => 
                (u.email && u.email.toLowerCase().trim() === identifier) || 
                (u.username && u.username.toLowerCase().replace(/^@/, '').trim() === identifier)
              );
              let isMatch = false;
              if (matched && matched.password_hash) {
                isMatch = await comparePassword(password, matched.password_hash) || await comparePassword(password.trim(), matched.password_hash);
              } else if (matched && matched.password) {
                isMatch = (matched.password === password || matched.password === password.trim());
              }
              // Check if user is Super Admin
              const mRole = String(matched.role || '').toLowerCase().trim();
              const isSuper = matched.role_id === 1 || mRole === 'super admin' || mRole === 'superadmin';
              if (matched && isMatch) {
                if (!isSuper) {
                  const mComp = matched.companyId || matched.company_id || (Array.isArray(matched.companyIds) ? matched.companyIds[0] : null);
                  if (mComp) {
                    const [delRows] = await pool.execute(
                      'SELECT 1 FROM deleted_items WHERE (LOWER(TRIM(item_id)) = ? OR LOWER(TRIM(item_id)) = ?) AND module_name = "companies"',
                      [String(mComp).toLowerCase().trim(), String(mComp).toLowerCase().trim()]
                    );
                    if (delRows.length > 0) {
                      return errorResponse(res, 403, 'Company not available. Please contact administrator.');
                    }
                    const [compRows] = await pool.execute(
                      'SELECT id, status FROM companies WHERE id = ? OR slug = ?',
                      [mComp, mComp]
                    );
                    if (compRows.length === 0 || (compRows[0].status && compRows[0].status.toLowerCase() !== 'active')) {
                      return errorResponse(res, 403, 'Company not available. Please contact administrator.');
                    }
                  } else {
                    return errorResponse(res, 403, 'Company not available. Please contact administrator.');
                  }
                }
                const token = generateToken({ id: matched.id, email: matched.email, role_id: matched.role_id || 3 });
                return successResponse(res, 200, 'Login successful', { user: matched, token });
              }
            }
          }
        } catch {}

        return errorResponse(res, 401, 'Account does not exist. Please check your email or username.');
      }
    }

    const user = users[0];

    // Check email verification
    if (user.is_verified === 0) {
      if (user.role_id) {
        await pool.execute('UPDATE users SET is_verified = 1 WHERE id = ?', [user.id]);
        user.is_verified = 1;
      } else {
        try { await sendEmailVerificationOTP(user.email, user.full_name); } catch (e) {}
        return errorResponse(res, 403, 'Email not verified. A new OTP has been sent to your email.');
      }
    }

    if (user.status && user.status.toLowerCase() === 'inactive') {
      const isSuper = user.role_id === 1 || String(user.role_name || user.role || '').toLowerCase().includes('super') || (user.email && user.email.toLowerCase().trim() === 'saampark.official@gmail.com');
      if (isSuper) {
        await pool.execute('UPDATE users SET status = "active", updated_at = NOW() WHERE id = ?', [user.id]).catch(() => {});
        user.status = 'active';
      } else {
        return errorResponse(res, 403, 'Your account is on inactive stage, please contact your administration.');
      }
    }

    // Check if account was deleted in deleted_items
    const uEmailNorm = (user.email || '').toLowerCase().trim();
    const uIdStr = String(user.id || '').toLowerCase().trim();
    const [delRows] = await pool.execute(
      'SELECT 1 FROM deleted_items WHERE (LOWER(TRIM(item_id)) = ? OR LOWER(TRIM(item_id)) = ?) AND module_name = "users"',
      [uEmailNorm, uIdStr]
    );
    if (delRows.length > 0 && user.role_id !== 1 && uEmailNorm !== 'saampark.official@gmail.com') {
      if (user.deleted_at === null && (!user.status || user.status.toLowerCase() === 'active')) {
        // Auto-heal stale entry in deleted_items since account is active in users table
        await pool.execute(
          'DELETE FROM deleted_items WHERE (LOWER(TRIM(item_id)) = ? OR LOWER(TRIM(item_id)) = ?) AND module_name = "users"',
          [uEmailNorm, uIdStr]
        ).catch(() => {});
      } else {
        return errorResponse(res, 403, 'Your account has been deleted. Please contact your administrator.');
      }
    }

    let isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch && password.trim() !== password) {
      isMatch = await comparePassword(password.trim(), user.password_hash);
    }

    if (!isMatch) {
      // Auto-heal check: Did password change in app_data JSON users store?
      try {
        const [appDataRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "users"');
        if (appDataRows.length > 0 && appDataRows[0].data_json) {
          const list = JSON.parse(appDataRows[0].data_json);
          if (Array.isArray(list)) {
            const matched = list.find((u) => 
              (u.email && u.email.toLowerCase().trim() === identifier) ||
              (u.username && u.username.toLowerCase().replace(/^@/, '').trim() === identifier)
            );
            if (matched) {
              let appDataMatch = false;
              if (matched.password_hash) {
                appDataMatch = await comparePassword(password, matched.password_hash) || await comparePassword(password.trim(), matched.password_hash);
              } else if (matched.password) {
                appDataMatch = (matched.password === password || matched.password === password.trim());
              }
              if (appDataMatch) {
                isMatch = true;
                // Auto-heal MySQL users table password_hash
                const healedHash = await hashPassword(password.trim());
                await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [healedHash, user.id]);
              }
            }
          }
        }
      } catch (syncErr) {
        console.warn('Password auto-heal check error:', syncErr.message);
      }
    }

    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid password. Please try again.');
    }

    // Enforce Company Availability Check for non-Super Admin users
    const uRole = String(user.role_name || user.role || '').toLowerCase().trim();
    const isSuperAdmin = user.role_id === 1 || uRole === 'super admin' || uRole === 'superadmin';
    if (!isSuperAdmin) {
      let compTarget = user.company_id;

      if (!compTarget) {
        // Check if user has company defined in app_data JSON users module
        try {
          const [appDataRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "users"');
          if (appDataRows.length > 0) {
            const list = JSON.parse(appDataRows[0].data_json);
            if (Array.isArray(list)) {
              const matched = list.find((u) => u.email && u.email.toLowerCase().trim() === identifier);
              if (matched) {
                compTarget = matched.companyId || matched.company_id || (Array.isArray(matched.companyIds) ? matched.companyIds[0] : null);
              }
            }
          }
        } catch {}
      }

      if (compTarget && String(compTarget).toLowerCase().trim() !== 'all') {
        const [delRows] = await pool.execute(
          'SELECT 1 FROM deleted_items WHERE (LOWER(TRIM(item_id)) = ? OR LOWER(TRIM(item_id)) = ?) AND module_name = "companies"',
          [String(compTarget).toLowerCase().trim(), String(compTarget).toLowerCase().trim()]
        );
        if (delRows.length > 0) {
          return errorResponse(res, 403, 'Company not available. Please contact administrator.');
        }

        const [compRows] = await pool.execute(
          'SELECT id, status FROM companies WHERE LOWER(id) = LOWER(?) OR LOWER(slug) = LOWER(?)',
          [compTarget, compTarget]
        );
        if (compRows.length > 0 && compRows[0].status && compRows[0].status.toLowerCase() !== 'active') {
          return errorResponse(res, 403, 'Company not available. Please contact administrator.');
        }
      }
    }

    const token = generateToken({ id: user.id, email: user.email, role_id: user.role_id });

    // Update last login
    const hasPin = Boolean(user.pin_hash);
    const mustSetupPin = !hasPin && !user.pin_setup_completed;
    delete user.password_hash;
    delete user.pin_hash;
    user.hasPin = hasPin;
    user.mustSetupPin = mustSetupPin;
    user.kycStatus = user.kyc_status || 'Pending';
    if (user.kyc_data) {
      try {
        user.kycData = typeof user.kyc_data === 'string' ? JSON.parse(user.kyc_data) : user.kyc_data;
      } catch {
        user.kycData = null;
      }
    }

    return successResponse(res, 200, 'Login successful', { user, token, hasPin, mustSetupPin });
  } catch (error) {
    next(error);
  }
};

// ─── CHECK USERNAME AVAILABILITY ─────────────────────────────────────────────
const checkUsername = async (req, res, next) => {
  try {
    const rawUsername = (req.params.username || req.query.username || req.body.username || '').toLowerCase().replace(/^@/, '').trim();
    const excludeId = req.query.excludeId || req.body.excludeId;
    const excludeEmail = (req.query.excludeEmail || req.body.excludeEmail || '').toLowerCase().trim();

    if (!rawUsername) {
      return errorResponse(res, 400, 'Username is required.');
    }

    if (rawUsername.length < 3 || rawUsername.length > 30) {
      return res.status(200).json({ status: 'success', available: false, message: 'Username must be between 3 and 30 characters.' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(rawUsername)) {
      return res.status(200).json({ status: 'success', available: false, message: 'Username can only contain letters, numbers, and underscores.' });
    }

    // Reserved usernames
    const reserved = ['admin', 'superadmin', 'root', 'support', 'help', 'api', 'saampark', 'login', 'null', 'undefined'];
    if (reserved.includes(rawUsername)) {
      return res.status(200).json({ status: 'success', available: false, message: 'This username is reserved.' });
    }

    // Check users table
    let existing = [];
    try {
      [existing] = await pool.execute(
        'SELECT id, email, username FROM users WHERE LOWER(username) = ? AND deleted_at IS NULL',
        [rawUsername]
      );
    } catch (dbErr) {
      if (dbErr.code === 'ER_BAD_FIELD_ERROR' && (dbErr.message.includes('username') || dbErr.sqlMessage?.includes('username'))) {
        existing = [];
      } else {
        throw dbErr;
      }
    }

    if (existing.length > 0) {
      const match = existing[0];
      if ((excludeId && String(match.id) === String(excludeId)) || (excludeEmail && match.email.toLowerCase().trim() === excludeEmail)) {
        return res.status(200).json({ status: 'success', available: true, message: 'This is your current username.' });
      }
      return res.status(200).json({ status: 'success', available: false, message: 'Username is already taken.' });
    }

    // Check app_data table
    try {
      const [appDataRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "users"');
      if (appDataRows.length > 0) {
        const list = JSON.parse(appDataRows[0].data_json);
        if (Array.isArray(list)) {
          const matched = list.find((u) => u.username && u.username.toLowerCase().trim() === rawUsername);
          if (matched) {
            if ((excludeId && String(matched.id) === String(excludeId)) || (excludeEmail && matched.email?.toLowerCase().trim() === excludeEmail)) {
              return res.status(200).json({ status: 'success', available: true, message: 'This is your current username.' });
            }
            return res.status(200).json({ status: 'success', available: false, message: 'Username is already taken.' });
          }
        }
      }
    } catch {}

    return res.status(200).json({ status: 'success', available: true, message: 'Username is available!' });
  } catch (error) {
    next(error);
  }
};

// ─── SEND FORGOT PASSWORD OTP ─────────────────────────────────────────────────
const sendForgotPasswordOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return errorResponse(res, 400, 'Email address is required.');

    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    const userName = users.length > 0 ? users[0].full_name : 'User';

    try {
      await sendPasswordResetOTP(email.toLowerCase(), userName);
    } catch (emailErr) {
      console.error('OTP email error:', emailErr.message);
      return errorResponse(res, 500, `Failed to send OTP email: ${emailErr.message}`);
    }

    return successResponse(res, 200, 'OTP sent to your email address. Valid for 10 minutes.');
  } catch (error) {
    next(error);
  }
};


// ─── VERIFY RESET OTP ─────────────────────────────────────────────────────────
const verifyResetOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return errorResponse(res, 400, 'Email and OTP are required.');

    const result = verifyOTP(email.toLowerCase(), otp, 'reset');
    if (!result.valid) return errorResponse(res, 400, result.error);

    // Issue a short-lived reset token
    const resetToken = generateToken({ email: email.toLowerCase(), purpose: 'password_reset' }, '15m');

    return successResponse(res, 200, 'OTP verified successfully.', { resetToken });
  } catch (error) {
    next(error);
  }
};

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword, resetToken } = req.body;
    if (!email || !newPassword || !resetToken) {
      return errorResponse(res, 400, 'Email, new password and reset token are required.');
    }

    // Verify the reset token
    const { verifyToken } = require('../utils/generateToken');
    let decoded;
    try {
      decoded = verifyToken(resetToken);
    } catch {
      return errorResponse(res, 401, 'Invalid or expired reset token. Please start over.');
    }

    if (decoded.purpose !== 'password_reset' || decoded.email !== email.toLowerCase()) {
      return errorResponse(res, 401, 'Invalid reset token.');
    }

    const pwdErr = validatePasswordPolicy(newPassword);
    if (pwdErr) {
      return errorResponse(res, 400, pwdErr);
    }

    const hashedPassword = await hashPassword(newPassword);
    const canonEmail = email.toLowerCase().trim();
    const [updateRes] = await pool.execute('UPDATE users SET password_hash = ? WHERE LOWER(email) = ?', [hashedPassword, canonEmail]);

    // If user was not yet in SQL users table, ensure they are inserted
    if (updateRes.affectedRows === 0) {
      try {
        const [appDataRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "users"');
        if (appDataRows.length > 0) {
          const list = JSON.parse(appDataRows[0].data_json);
          const matched = Array.isArray(list) ? list.find((u) => u.email && u.email.toLowerCase().trim() === canonEmail) : null;
          if (matched) {
            let role_id = 3;
            const r = (matched.role || '').toLowerCase();
            if (r.includes('super')) role_id = 1;
            else if (r.includes('admin')) role_id = 2;
            else if (r.includes('client')) role_id = 4;
            await pool.execute(
              `INSERT INTO users (full_name, email, password_hash, role_id, status, created_at, updated_at) 
               VALUES (?, ?, ?, ?, 'active', NOW(), NOW())`,
              [matched.name || matched.full_name || canonEmail, canonEmail, hashedPassword, role_id]
            );
          }
        }
      } catch (insErr) {
        console.warn('Auto-insert into users on resetPassword failed:', insErr.message);
      }
    }

    // Also update password in app_data JSON users store
    try {
      const [appDataRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "users"');
      if (appDataRows.length > 0) {
        let list = JSON.parse(appDataRows[0].data_json);
        if (Array.isArray(list)) {
          const idx = list.findIndex((u) => u.email && u.email.toLowerCase().trim() === canonEmail);
          if (idx >= 0) {
            list[idx].password_hash = hashedPassword;
            delete list[idx].password;
            await pool.execute(
              `INSERT INTO app_data (module_key, data_json) VALUES ('users', ?)
               ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = NOW()`,
              [JSON.stringify(list)]
            );
          }
        }
      }
    } catch {}

    return successResponse(res, 200, 'Password reset successfully. You can now log in with your new password.');
  } catch (error) {
    next(error);
  }
};

// ─── GET PROFILE ──────────────────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    let users = [];
    try {
      [users] = await pool.execute(
        'SELECT u.id, u.full_name, u.email, u.username, u.phone, u.status, u.permissions, u.last_login, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
        [req.user.id]
      );
    } catch (dbErr) {
      if (dbErr.code === 'ER_BAD_FIELD_ERROR' && (dbErr.message.includes('username') || dbErr.sqlMessage?.includes('username'))) {
        [users] = await pool.execute(
          'SELECT u.id, u.full_name, u.email, NULL as username, u.phone, u.status, u.permissions, u.last_login, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
          [req.user.id]
        );
      } else {
        throw dbErr;
      }
    }

    if (users.length === 0) {
      return errorResponse(res, 404, 'User profile not found.');
    }

    return successResponse(res, 200, 'User profile retrieved', users[0]);
  } catch (error) {
    next(error);
  }
};

// ─── LOGIN WITH 4-DIGIT PIN ──────────────────────────────────────────────────
const loginWithPin = async (req, res, next) => {
  try {
    const { email, identifier, pin } = req.body;
    const targetEmail = (email || identifier || '').toLowerCase().trim();
    if (!targetEmail || !pin) {
      return errorResponse(res, 400, 'Email/Username and 4-digit PIN are required.');
    }
    const cleanPin = String(pin).trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      return errorResponse(res, 400, 'PIN must be exactly 4 numeric digits.');
    }

    let [users] = await pool.execute(
      `SELECT u.*, COALESCE(r.name, 'Teams') as role_name 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE (LOWER(u.email) = ? OR LOWER(COALESCE(u.username, '')) = ?)`,
      [targetEmail, targetEmail]
    );

    let user = users[0];

    // Check app_data JSON fallback if not found or pin_hash missing in SQL
    try {
      const [appDataRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "users"');
      if (appDataRows.length > 0) {
        const list = JSON.parse(appDataRows[0].data_json);
        if (Array.isArray(list)) {
          const matched = list.find((u) => 
            (u.email && u.email.toLowerCase().trim() === targetEmail) ||
            (u.username && u.username.toLowerCase().trim() === targetEmail)
          );
          if (matched) {
            if (!user) user = { ...matched, id: matched.id || 1, email: matched.email };
            if (!user.pin_hash && (matched.pin_hash || matched.pin)) {
              user.pin_hash = matched.pin_hash || matched.pin;
            }
          }
        }
      }
    } catch {}

    if (!user) {
      return errorResponse(res, 404, 'Account not found. Please verify your email.');
    }

    if (!user.pin_hash) {
      return errorResponse(res, 400, 'Security PIN has not been set up yet for this account. Please sign in with your password.');
    }

    // Verify PIN against pin_hash
    let isMatch = await comparePassword(cleanPin, user.pin_hash);
    if (!isMatch && user.pin_hash === cleanPin) {
      isMatch = true; // Plaintext fallback if legacy
    }

    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid Security PIN. Please try again.');
    }

    // Check deactivated status
    if (user.status && user.status.toLowerCase() === 'inactive') {
      const isSuper = user.role_id === 1 || String(user.role_name || user.role || '').toLowerCase().includes('super') || (user.email && user.email.toLowerCase().trim() === 'saampark.official@gmail.com');
      if (!isSuper) {
        return errorResponse(res, 403, 'Your account is on inactive stage, please contact your administration.');
      }
    }

    const token = generateToken({ id: user.id, email: user.email, role_id: user.role_id });
    await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]).catch(() => {});

    delete user.password_hash;
    delete user.pin_hash;
    user.hasPin = true;
    user.mustSetupPin = false;

    return successResponse(res, 200, 'PIN authentication successful', { user, token, hasPin: true });
  } catch (error) {
    next(error);
  }
};

// ─── SETUP 4-DIGIT PIN ───────────────────────────────────────────────────────
const setupPin = async (req, res, next) => {
  try {
    const { email, pin, otp } = req.body;
    const targetEmail = (email || req.user?.email || '').toLowerCase().trim();
    if (!targetEmail || !pin) {
      return errorResponse(res, 400, 'User email and 4-digit PIN are required.');
    }
    const cleanPin = String(pin).trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      return errorResponse(res, 400, 'PIN must be exactly 4 numeric digits.');
    }

    // Verify OTP if provided
    if (otp) {
      const { verifyOTP } = require('../utils/emailService');
      const otpRes = verifyOTP(targetEmail, String(otp).trim());
      if (!otpRes || !otpRes.valid) {
        return errorResponse(res, 400, otpRes?.error || 'Invalid or expired verification code. Please request a new code.');
      }
    }

    const pinHash = await hashPassword(cleanPin);

    // Update in MySQL users table
    await pool.execute(
      'UPDATE users SET pin_hash = ?, pin_setup_completed = 1, updated_at = NOW() WHERE LOWER(email) = ?',
      [pinHash, targetEmail]
    );

    // Sync to app_data JSON users store
    try {
      const [appDataRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "users"');
      if (appDataRows.length > 0) {
        let list = JSON.parse(appDataRows[0].data_json);
        if (Array.isArray(list)) {
          const idx = list.findIndex(u => u.email && u.email.toLowerCase().trim() === targetEmail);
          if (idx >= 0) {
            list[idx].pin_hash = pinHash;
            list[idx].pin_setup_completed = true;
            list[idx].hasPin = true;
            await pool.execute('UPDATE app_data SET data_json = ?, updated_at = NOW() WHERE module_key = "users"', [JSON.stringify(list)]);
          }
        }
      }
    } catch {}

    return successResponse(res, 200, '4-Digit Security PIN successfully created and enabled!');
  } catch (error) {
    next(error);
  }
};

// ─── SEND PIN RESET / CHANGE OTP ────────────────────────────────────────────
const sendPinResetOTPHandler = async (req, res, next) => {
  try {
    const { email } = req.body;
    const targetEmail = (email || req.user?.email || '').toLowerCase().trim();
    if (!targetEmail) {
      return errorResponse(res, 400, 'Email address is required.');
    }

    const [users] = await pool.execute('SELECT full_name, email, company_id FROM users WHERE LOWER(email) = ?', [targetEmail]);
    const name = users[0]?.full_name || req.user?.name || 'User';
    const compId = users[0]?.company_id || req.user?.company_id || null;

    const { sendPinResetOTP } = require('../utils/emailService');
    await sendPinResetOTP(targetEmail, name, compId);

    return successResponse(res, 200, `A 6-digit verification code has been sent to ${targetEmail}`);
  } catch (error) {
    next(error);
  }
};

// ─── RESET PIN WITH OTP ─────────────────────────────────────────────────────
const resetPinWithOTP = async (req, res, next) => {
  try {
    const { email, otp, newPin } = req.body;
    const targetEmail = (email || req.user?.email || '').toLowerCase().trim();
    if (!targetEmail || !otp || !newPin) {
      return errorResponse(res, 400, 'Email, OTP code, and new 4-digit PIN are required.');
    }
    const cleanPin = String(newPin).trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      return errorResponse(res, 400, 'PIN must be exactly 4 numeric digits.');
    }

    const { verifyOTP } = require('../utils/emailService');
    const otpRes = verifyOTP(targetEmail, String(otp).trim());
    if (!otpRes || !otpRes.valid) {
      return errorResponse(res, 400, otpRes?.error || 'Invalid or expired verification code. Please request a new code.');
    }

    const pinHash = await hashPassword(cleanPin);

    await pool.execute(
      'UPDATE users SET pin_hash = ?, pin_setup_completed = 1, updated_at = NOW() WHERE LOWER(email) = ?',
      [pinHash, targetEmail]
    );

    // Sync to app_data JSON users store
    try {
      const [appDataRows] = await pool.execute('SELECT data_json FROM app_data WHERE module_key = "users"');
      if (appDataRows.length > 0) {
        let list = JSON.parse(appDataRows[0].data_json);
        if (Array.isArray(list)) {
          const idx = list.findIndex(u => u.email && u.email.toLowerCase().trim() === targetEmail);
          if (idx >= 0) {
            list[idx].pin_hash = pinHash;
            list[idx].pin_setup_completed = true;
            list[idx].hasPin = true;
            await pool.execute('UPDATE app_data SET data_json = ?, updated_at = NOW() WHERE module_key = "users"', [JSON.stringify(list)]);
          }
        }
      }
    } catch {}

    return successResponse(res, 200, '4-Digit Security PIN successfully updated!');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  loginWithPin,
  setupPin,
  sendPinResetOTPHandler,
  resetPinWithOTP,
  checkUsername,
  sendForgotPasswordOTP,
  verifyResetOTP,
  resetPassword,
  getProfile,
};