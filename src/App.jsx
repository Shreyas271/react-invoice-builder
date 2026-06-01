import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

function App() {
  const printRef = useRef();
  const [isGenerating, setIsGenerating] = useState(false);

  // Invoice State
  const [invoiceNumber, setInvoiceNumber] = useState(Math.floor(Math.random() * 100000));
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Client State
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');

  // Company State
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('invoice-company-name') || '');
  const [companyAddress, setCompanyAddress] = useState(() => localStorage.getItem('invoice-company-address') || '');

  // Items State
  const [items, setItems] = useState([
    { id: Date.now(), description: '', quantity: 1, rate: 0 }
  ]);
  const [taxRate, setTaxRate] = useState(5);

  // Save Company Details
  useEffect(() => {
    localStorage.setItem('invoice-company-name', companyName);
    localStorage.setItem('invoice-company-address', companyAddress);
  }, [companyName, companyAddress]);

  // Math Helpers
  const calculateAmount = (qty, rate) => qty * rate;
  const subtotal = items.reduce((sum, item) => sum + calculateAmount(item.quantity, item.rate), 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = subtotal + taxAmount;

  // Item Handlers
  const addItem = () => setItems([...items, { id: Date.now(), description: '', quantity: 1, rate: 0 }]);
  const removeItem = (id) => setItems(items.filter(item => item.id !== id));
  const updateItem = (id, field, value) => {
    setItems(items.map(item => (item.id === id ? { ...item, [field]: value } : item)));
  };

  // NEW STABLE PDF EXPORT
  const downloadPDF = async () => {
    setIsGenerating(true);
    const element = printRef.current;

    try {
      // 1. Take a high-quality picture of the right side of the screen
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');

      // 2. Create the PDF document (A4 size)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // 3. Add the picture to the PDF and download it
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${invoiceNumber}.pdf`);
      
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1400px] mx-auto bg-gray-50 text-gray-800">
      
      {/* LEFT SIDE: CONTROLS */}
      <div className="lg:col-span-5 space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800">Invoice Editor</h2>
          <button 
            onClick={downloadPDF} 
            disabled={isGenerating}
            className={`px-4 py-2 rounded-lg transition font-medium cursor-pointer ${isGenerating ? 'bg-gray-400 text-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {isGenerating ? 'Generating...' : 'Download PDF'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Invoice Number</label>
            <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="w-full border border-gray-300 p-2 rounded-md focus:ring-blue-500 bg-white outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-gray-300 p-2 rounded-md focus:ring-blue-500 bg-white outline-none" />
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold text-gray-700">Your Company Details</h3>
          <input type="text" placeholder="Your Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full border border-gray-300 p-2 rounded-md bg-white outline-none" />
          <textarea placeholder="Your Company Address" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className="w-full border border-gray-300 p-2 rounded-md bg-white outline-none" rows="2" />
        </div>

        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold text-gray-700">Client Details</h3>
          <input type="text" placeholder="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full border border-gray-300 p-2 rounded-md bg-white outline-none" />
          <textarea placeholder="Client Address" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className="w-full border border-gray-300 p-2 rounded-md bg-white outline-none" rows="2" />
        </div>

        <div className="space-y-4 border-t pt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Line Items</h3>
            <button onClick={addItem} className="text-sm bg-gray-100 border border-gray-300 px-3 py-1 rounded-md hover:bg-gray-200 cursor-pointer text-gray-800">+ Add Item</button>
          </div>
          
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-3 rounded-lg border border-gray-300">
              <input type="text" placeholder="Item Name" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} className="col-span-5 border border-gray-300 p-2 rounded-md text-sm bg-white outline-none" />
              <input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))} className="col-span-2 border border-gray-300 p-2 rounded-md text-sm bg-white outline-none" />
              <input type="number" min="0" placeholder="Rate" value={item.rate} onChange={(e) => updateItem(item.id, 'rate', Number(e.target.value))} className="col-span-3 border border-gray-300 p-2 rounded-md text-sm bg-white outline-none" />
              <button onClick={() => removeItem(item.id)} className="col-span-2 text-red-500 hover:text-red-700 text-sm font-semibold cursor-pointer">Del</button>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <label className="block text-sm font-semibold text-gray-600 mb-1">Tax Rate (%)</label>
          <input type="number" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} className="w-32 border border-gray-300 p-2 rounded-md bg-white outline-none" />
        </div>
      </div>

      {/* RIGHT SIDE: PREVIEW */}
      <div className="lg:col-span-7 flex justify-center items-start">
        <div ref={printRef} className="bg-white p-8 sm:p-12 w-full max-w-3xl shadow-lg border border-gray-200 text-gray-800">
          
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-gray-800 pb-6 mb-8 gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-600 uppercase tracking-wider mb-2">INVOICE</h1>
              <p className="text-gray-500 text-sm sm:text-base"><strong>Invoice #:</strong> {invoiceNumber}</p>
              <p className="text-gray-500 text-sm sm:text-base"><strong>Date:</strong> {date}</p>
            </div>
            <div className="sm:text-right">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{companyName || "Your Company"}</h2>
              <p className="text-gray-500 whitespace-pre-line mt-1 text-sm sm:text-base">{companyAddress}</p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-gray-500 font-bold uppercase text-xs sm:text-sm mb-2">Bill To:</h3>
            <p className="text-lg sm:text-xl font-semibold">{clientName || "Client Name"}</p>
            <p className="text-gray-600 whitespace-pre-line text-sm sm:text-base">{clientAddress || "Client Address"}</p>
          </div>

          <div className="overflow-hidden mb-8">
            <table className="w-full border-collapse text-sm sm:text-base">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600 uppercase text-xs sm:text-sm">
                  <th className="p-3 font-semibold rounded-tl-lg">Description</th>
                  <th className="p-3 font-semibold text-center">Qty</th>
                  <th className="p-3 font-semibold text-right">Rate</th>
                  <th className="p-3 font-semibold text-right rounded-tr-lg">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="p-3">{item.description || "—"}</td>
                    <td className="p-3 text-center">{item.quantity}</td>
                    <td className="p-3 text-right">₹{item.rate.toFixed(2)}</td>
                    <td className="p-3 text-right font-medium">₹{calculateAmount(item.quantity, item.rate).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end text-sm sm:text-base">
            <div className="w-full sm:w-72 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2 text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2 text-gray-600">
                <span>Tax ({taxRate}%)</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mt-4 pt-4 border-t-2 border-gray-200">
                <span className="text-base sm:text-lg font-bold">Grand Total</span>
                <span className="text-base sm:text-lg font-bold text-blue-600">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-16 text-center text-xs sm:text-sm text-gray-400 border-t pt-4">
            Thank you for your business!
          </div>

        </div>
      </div>

    </div>
  );
}

export default App;