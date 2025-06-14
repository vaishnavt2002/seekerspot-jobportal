import React, { useEffect } from 'react';

const PrintWrapper = ({ children, onPrint }) => {
  // Apply print-specific styles when printing starts and remove them after
  useEffect(() => {
    const beforePrint = () => {
      // Add any additional print preparation here
      document.body.classList.add('printing');
    };

    const afterPrint = () => {
      document.body.classList.remove('printing');
    };

    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);

    return () => {
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', afterPrint);
    };
  }, []);

  // Custom print handler
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    }
    window.print();
  };

  return (
    <div className="print-wrapper" style={{ width: '100%', margin: 0, padding: 0 }}>
      {React.Children.map(children, child => {
        // Clone the child element to add the print handler
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            handlePrint: handlePrint
          });
        }
        return child;
      })}
    </div>
  );
};

export default PrintWrapper;