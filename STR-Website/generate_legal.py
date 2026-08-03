import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find Navbar end
nav_end_match = re.search(r'</nav>\s*', content)
if not nav_end_match:
    print("Could not find </nav>")
    exit(1)
nav_end_idx = nav_end_match.end()

# Find Footer start
footer_start_match = re.search(r'<!-- FOOTER -->\s*<footer', content)
if not footer_start_match:
    print("Could not find footer")
    exit(1)
footer_start_idx = footer_start_match.start()

header_part = content[:nav_end_idx]
footer_part = content[footer_start_idx:]

# Common legal page CSS to inject into header
legal_css = """
<style>
  .legal-container {
    max-width: 900px;
    margin: 120px auto 60px;
    padding: 3rem 2rem;
    background: #ffffff;
    border-radius: 24px;
    box-shadow: 0 10px 40px rgba(10, 74, 46, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.2);
  }
  .legal-title {
    font-family: 'Orbitron', monospace;
    font-size: 2.5rem;
    color: var(--green-dark);
    margin-bottom: 0.5rem;
  }
  .legal-date {
    color: var(--text-muted);
    font-size: 0.9rem;
    margin-bottom: 2.5rem;
    font-weight: 600;
  }
  .legal-content h2 {
    font-size: 1.5rem;
    color: var(--green-mid);
    margin: 2rem 0 1rem;
    font-family: 'Orbitron', monospace;
  }
  .legal-content p, .legal-content ul {
    font-size: 1.05rem;
    color: var(--text-mid);
    line-height: 1.7;
    margin-bottom: 1.2rem;
  }
  .legal-content ul {
    padding-left: 1.5rem;
  }
  .legal-content li {
    margin-bottom: 0.5rem;
  }
  @media (max-width: 768px) {
    .legal-container {
      margin: 100px 1rem 40px;
      padding: 2rem 1.5rem;
    }
    .legal-title { font-size: 1.8rem; }
  }
</style>
"""

header_part = header_part.replace('</head>', legal_css + '</head>')

privacy_body = """
<div class="legal-container">
  <h1 class="legal-title">Privacy Policy</h1>
  <div class="legal-date">Last Updated: August 2026</div>
  <div class="legal-content">
    <p>Welcome to Saampark Technology & Research Pvt. Ltd. ("STR"). We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, process, and protect your information when you visit our website, use our services, or interact with us.</p>
    
    <h2>1. Information We Collect</h2>
    <p>We may collect and process the following data about you:</p>
    <ul>
      <li><strong>Identity Data:</strong> Name, username, title, etc.</li>
      <li><strong>Contact Data:</strong> Email address, billing address, phone numbers.</li>
      <li><strong>Technical Data:</strong> IP address, browser type, time zone setting, operating system.</li>
      <li><strong>Usage Data:</strong> Information about how you use our website, products, and services.</li>
    </ul>

    <h2>2. How We Use Your Data</h2>
    <p>We use your personal data to:</p>
    <ul>
      <li>Provide, operate, and maintain our services.</li>
      <li>Improve, personalize, and expand our digital products.</li>
      <li>Communicate with you regarding updates, offers, and support.</li>
      <li>Process transactions and prevent fraud.</li>
    </ul>

    <h2>3. Data Security</h2>
    <p>We have implemented robust security measures to prevent your personal data from being accidentally lost, used, accessed in an unauthorized way, altered, or disclosed. We limit access to your personal data to those employees, agents, and contractors who have a business need to know.</p>

    <h2>4. Third-Party Links</h2>
    <p>Our website may include links to third-party websites, plug-ins, and applications. Clicking on those links may allow third parties to collect or share data about you. We do not control these third-party websites and are not responsible for their privacy statements.</p>

    <h2>5. Contact Us</h2>
    <p>If you have any questions about this privacy policy or our privacy practices, please contact us at <strong>info@saampark.com</strong>.</p>
  </div>
</div>
"""

terms_body = """
<div class="legal-container">
  <h1 class="legal-title">Terms of Service</h1>
  <div class="legal-date">Last Updated: August 2026</div>
  <div class="legal-content">
    <p>These Terms of Service govern your use of the website and services provided by Saampark Technology & Research Pvt. Ltd. ("STR"). By accessing or using our services, you agree to be bound by these terms.</p>
    
    <h2>1. Acceptance of Terms</h2>
    <p>By accessing our website and digital solutions, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use our services.</p>

    <h2>2. Service Provision</h2>
    <p>STR provides software development, 3D UI/UX design, cloud hosting, AI automation, and consultancy services. We reserve the right to modify, suspend, or discontinue any aspect of our services at any time without notice.</p>

    <h2>3. Intellectual Property</h2>
    <p>All content, designs, code, graphics, and interfaces created by STR remain the exclusive intellectual property of Saampark Technology & Research Pvt. Ltd. unless explicitly transferred through a signed agreement. You may not copy, reproduce, or distribute our intellectual property without prior written consent.</p>

    <h2>4. User Responsibilities</h2>
    <p>When using our services or communicating with us, you agree not to:</p>
    <ul>
      <li>Violate any local, state, national, or international law.</li>
      <li>Interfere with or disrupt the security or integrity of our platforms.</li>
      <li>Transmit any malicious code, viruses, or harmful data.</li>
    </ul>

    <h2>5. Limitation of Liability</h2>
    <p>STR shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or use of, or inability to access or use, our services and digital products.</p>

    <h2>6. Governing Law</h2>
    <p>These terms are governed by and construed in accordance with the laws of India. Any disputes relating to these terms will be subject to the exclusive jurisdiction of the courts in West Bengal, India.</p>
  </div>
</div>
"""

# Update links in header and footer to be correct across all files
def update_links(text):
    text = re.sub(r'href="#"([^>]*)>Privacy Policy</a>', r'href="privacy.html"\1>Privacy Policy</a>', text)
    text = re.sub(r'href="#"([^>]*)>Terms of Service</a>', r'href="terms.html"\1>Terms of Service</a>', text)
    # also replace any other cases
    text = text.replace('href="#"', 'href="javascript:void(0)"') # fallback for other dead links
    return text

header_part = update_links(header_part)
footer_part = update_links(footer_part)

# Also update index.html links
content = update_links(content)
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

with open('privacy.html', 'w', encoding='utf-8') as f:
    f.write(header_part + privacy_body + footer_part)

with open('terms.html', 'w', encoding='utf-8') as f:
    f.write(header_part + terms_body + footer_part)

print('Success')
