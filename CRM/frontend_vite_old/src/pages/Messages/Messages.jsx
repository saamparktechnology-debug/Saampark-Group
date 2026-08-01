import React from 'react';

const Messages = () => (
  <div className="page-container" style={{ display: 'flex', height: 'calc(100vh - 100px)', background: '#fff', border: '1px solid var(--border-light)', borderRadius: '4px' }}>
    <div style={{ width: '300px', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)' }}>
        <h3 style={{ margin: 0 }}>Messages</h3>
      </div>
      <div style={{ padding: '15px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-hover)', cursor: 'pointer' }}>
        <strong>John Doe</strong>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hey, can you send the files?</p>
      </div>
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
       <div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)' }}>
        <h4 style={{ margin: 0 }}>John Doe</h4>
      </div>
      <div style={{ flex: 1, padding: '20px', backgroundColor: 'var(--bg-main)' }}>
        <div style={{ background: '#fff', padding: '10px 15px', borderRadius: '8px', maxWidth: '60%', marginBottom: '10px' }}>
          Hey, can you send the files?
        </div>
      </div>
      <div style={{ padding: '20px', borderTop: '1px solid var(--border-light)', display: 'flex' }}>
        <input type="text" className="form-control" placeholder="Write a message..." style={{ flex: 1, marginRight: '10px' }}/>
        <button className="btn-primary">Send</button>
      </div>
    </div>
  </div>
);

export default Messages;
