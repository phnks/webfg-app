import React from 'react';
import './ErrorPopup.css';

const ErrorPopup = ({ error, onClose }) => {
  if (!error) {
    return null;
  }

  return (
    <div className="error-popup">
      <div className="error-popup-content">
        <h3>Error</h3>
        <p><strong>Message:</strong></p>
        <pre>{error.message}</pre>
        {error.stack && (
          <>
            <p><strong>Stack Trace:</strong></p>
            <pre>{error.stack}</pre>
          </>
        )}
        <button onClick={onClose}>Dismiss</button>
      </div>
    </div>
  );
};

export default ErrorPopup;
