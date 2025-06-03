const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.4.0/jspdf.umd.min.js';
script.onload = () => {
    window.jspdf = window.jspdf || {};
    window.jspdf.jsPDF = window.jspdf.jsPDF || jsPDF;
};
document.head.appendChild(script);