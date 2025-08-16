import React, { useState, useEffect, useRef } from 'react';
import { Customer, ServiceType, TransactionData } from './types';
import { BankIcon, UserIcon, QrCodeIcon, CheckCircleIcon, ArrowLeftIcon } from './components/icons';

// jsQR and QRCode will be available globally from the script tags in index.html
declare const jsQR: any;
declare const QRCode: any;

// --- Mock Data ---
const MOCK_CUSTOMER: Customer = {
  name: 'Jane Doe',
  accountNumber: '1234567890',
  balance: 5432.10,
};

// --- Main App Component ---
const App: React.FC = () => {
  const [userType, setUserType] = useState<'customer' | 'bank' | null>(null);

  const selectUserType = (type: 'customer' | 'bank') => {
    setUserType(type);
  };
  
  const resetApp = () => {
      setUserType(null);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans">
      <header className="absolute top-0 left-0 p-4 w-full flex justify-between items-center">
        <div className="flex items-center gap-2">
            <BankIcon className="w-8 h-8 text-indigo-500" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">QuickBank</h1>
        </div>
        {userType && (
            <button
              onClick={resetApp}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-semibold"
            >
              Switch Role
            </button>
        )}
      </header>
      
      <main className="w-full max-w-md">
        {!userType ? (
          <RoleSelectionScreen onSelect={selectUserType} />
        ) : userType === 'customer' ? (
          <CustomerView customer={MOCK_CUSTOMER} />
        ) : (
          <BankView />
        )}
      </main>
    </div>
  );
};

// --- Role Selection Screen ---
const RoleSelectionScreen: React.FC<{ onSelect: (type: 'customer' | 'bank') => void }> = ({ onSelect }) => (
  <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
    <h2 className="text-center text-2xl font-bold mb-8">Welcome to QuickBank</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <button
        onClick={() => onSelect('customer')}
        className="flex flex-col items-center justify-center p-6 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all transform hover:scale-105"
        aria-label="Select customer role"
      >
        <UserIcon className="w-12 h-12 mb-3 text-indigo-500" />
        <span className="font-semibold text-lg">I'm a Customer</span>
      </button>
      <button
        onClick={() => onSelect('bank')}
        className="flex flex-col items-center justify-center p-6 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all transform hover:scale-105"
        aria-label="Select bank teller role"
      >
        <BankIcon className="w-12 h-12 mb-3 text-indigo-500" />
        <span className="font-semibold text-lg">I'm a Bank Teller</span>
      </button>
    </div>
  </div>
);

// --- Customer View ---
const CustomerView: React.FC<{ customer: Customer }> = ({ customer }) => {
    const [service, setService] = useState<ServiceType | null>(null);
    const [transactionData, setTransactionData] = useState<TransactionData | null>(null);

    const handleServiceSelect = (selectedService: ServiceType) => {
        setService(selectedService);
    };
    
    const handleFormSubmit = (data: Omit<TransactionData, 'customerName' | 'accountNumber' | 'timestamp'>) => {
        const fullTransactionData: TransactionData = {
            ...data,
            customerName: customer.name,
            accountNumber: customer.accountNumber,
            timestamp: new Date().toISOString(),
        };
        setTransactionData(fullTransactionData);
    };
    
    const reset = () => {
        setService(null);
        setTransactionData(null);
    }

    if (transactionData) {
        return <QRCodeDisplay data={transactionData} onDone={reset} />;
    }

    if (service) {
        return <TransactionForm service={service} onSubmit={handleFormSubmit} onBack={() => setService(null)} />;
    }

    return <ServiceSelection customer={customer} onSelect={handleServiceSelect} />;
};

// --- Service Selection ---
const ServiceSelection: React.FC<{ customer: Customer; onSelect: (service: ServiceType) => void }> = ({ customer, onSelect }) => (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
        <div className="text-center mb-6">
            <h2 className="text-xl font-bold">Welcome, {customer.name}</h2>
            <p className="text-slate-500 dark:text-slate-400">Account: {customer.accountNumber}</p>
        </div>
        <h3 className="font-semibold mb-4 text-center">Select a Service:</h3>
        <div className="space-y-3">
            {Object.values(ServiceType).map((service) => (
                <button 
                    key={service} 
                    onClick={() => onSelect(service)}
                    className="w-full text-left p-4 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors font-medium"
                >
                    {service}
                </button>
            ))}
        </div>
    </div>
);

// --- Transaction Form ---
const TransactionForm: React.FC<{ service: ServiceType; onSubmit: (data: any) => void; onBack: () => void; }> = ({ service, onSubmit, onBack }) => {
    const [amount, setAmount] = useState('');
    const [details, setDetails] = useState('');
    const needsAmount = service === ServiceType.DEPOSIT || service === ServiceType.WITHDRAWAL;
    const needsDetails = service === ServiceType.UPDATE_DETAILS;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data: {serviceType: ServiceType; amount?: number; details?: string} = { serviceType: service };
        if (needsAmount) data.amount = parseFloat(amount);
        if (needsDetails) data.details = details;
        onSubmit(data);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
             <button onClick={onBack} className="flex items-center gap-2 mb-4 text-sm font-semibold text-indigo-500 hover:text-indigo-600">
                <ArrowLeftIcon className="w-4 h-4" /> Back
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center">{service}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                {needsAmount && (
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Amount ($)</label>
                        <input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            min="0.01"
                            step="0.01"
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            aria-label="Transaction amount"
                        />
                    </div>
                )}
                {needsDetails && (
                    <div>
                        <label htmlFor="details" className="block text-sm font-medium text-slate-700 dark:text-slate-300">New Details</label>
                         <textarea
                            id="details"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            required
                            rows={4}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter new phone number, address, etc."
                            aria-label="New contact details"
                        />
                    </div>
                )}
                <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Generate QR Code
                </button>
            </form>
        </div>
    );
};

// --- QR Code Display ---
const QRCodeDisplay: React.FC<{ data: TransactionData; onDone: () => void }> = ({ data, onDone }) => {
    const qrRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (qrRef.current) {
            qrRef.current.innerHTML = ''; // Clear previous QR code
            new QRCode(qrRef.current, {
                text: JSON.stringify(data),
                width: 256,
                height: 256,
                colorDark: "#000000",
                colorLight: "#ffffff",
            });
        }
    }, [data]);
    
    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Show this to the Teller</h2>
            <div className="p-4 bg-white inline-block rounded-lg my-4" aria-label="Transaction QR Code">
                 <div ref={qrRef}></div>
            </div>
            <div className="text-left space-y-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                <p><strong>Service:</strong> {data.serviceType}</p>
                <p><strong>Name:</strong> {data.customerName}</p>
                <p><strong>Account:</strong> {data.accountNumber}</p>
                {data.amount && <p><strong>Amount:</strong> ${data.amount.toFixed(2)}</p>}
                {data.details && <p><strong>Details:</strong> {data.details}</p>}
            </div>
             <button onClick={onDone} className="mt-8 w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Create Another Request
            </button>
        </div>
    );
};

// --- Bank View ---
const BankView: React.FC = () => {
    const [scannedData, setScannedData] = useState<TransactionData | null>(null);
    const [showScanner, setShowScanner] = useState(false);
    const [transactionComplete, setTransactionComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleScan = (data: string | null) => {
        if (data) {
            try {
                const parsedData = JSON.parse(data);
                if (parsedData.customerName && parsedData.accountNumber && parsedData.serviceType) {
                    setScannedData(parsedData);
                    setShowScanner(false);
                    setError(null);
                } else {
                    throw new Error("Invalid QR code data format.");
                }
            } catch (e) {
                setError("Failed to parse QR code. Please ensure it's a valid QuickBank code.");
                setShowScanner(false);
            }
        }
    };
    
    const reset = () => {
        setScannedData(null);
        setShowScanner(false);
        setTransactionComplete(false);
        setError(null);
    }
    
    const startScan = () => {
        setError(null);
        setShowScanner(true);
    }

    if (transactionComplete) {
        return (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg text-center">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Transaction Complete!</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">The customer's request has been processed successfully.</p>
                <button onClick={reset} className="mt-8 w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Scan Next Customer
                </button>
            </div>
        );
    }
    
    if (showScanner) {
        return <QRScanner onScan={handleScan} onCancel={() => setShowScanner(false)} />;
    }
    
    if (scannedData) {
        return (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg text-left">
                <h2 className="text-2xl font-bold mb-6 text-center">Confirm Transaction</h2>
                 <div className="space-y-2 text-slate-700 dark:text-slate-200">
                    <p><strong>Service:</strong> <span className="font-normal">{scannedData.serviceType}</span></p>
                    <p><strong>Name:</strong> <span className="font-normal">{scannedData.customerName}</span></p>
                    <p><strong>Account:</strong> <span className="font-normal">{scannedData.accountNumber}</span></p>
                    {scannedData.amount != null && <p><strong>Amount:</strong> <span className="font-normal">${scannedData.amount.toFixed(2)}</span></p>}
                    {scannedData.details && <p><strong>Details:</strong> <span className="font-normal whitespace-pre-wrap">{scannedData.details}</span></p>}
                    <p><strong>Timestamp:</strong> <span className="font-normal text-sm">{new Date(scannedData.timestamp).toLocaleString()}</span></p>
                </div>
                <div className="flex gap-4 mt-8">
                     <button onClick={reset} className="w-full py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none">
                        Cancel
                    </button>
                    <button onClick={() => setTransactionComplete(true)} className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        Confirm & Complete
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Teller Portal</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Ready to serve the next customer.</p>
            {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-md mb-6" role="alert">{error}</p>}
            <button onClick={startScan} className="w-full flex items-center justify-center gap-3 py-4 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <QrCodeIcon className="w-6 h-6" />
                Scan Customer QR Code
            </button>
        </div>
    );
};

// --- QR Scanner Component ---
const QRScanner: React.FC<{ onScan: (data: string | null) => void, onCancel: () => void }> = ({ onScan, onCancel }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let animationFrameId: number;
        let stream: MediaStream;

        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.setAttribute('playsinline', 'true');
                    videoRef.current.play();
                    animationFrameId = requestAnimationFrame(tick);
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
            }
        };

        const tick = () => {
            if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA) {
                const canvas = canvasRef.current;
                const video = videoRef.current;
                if (canvas && video) {
                    canvas.height = video.videoHeight;
                    canvas.width = video.videoWidth;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: 'dontInvert',
                        });

                        if (code) {
                            onScan(code.data);
                            return; // Stop scanning
                        }
                    }
                }
            }
            animationFrameId = requestAnimationFrame(tick);
        };
        
        startCamera();

        return () => {
            cancelAnimationFrame(animationFrameId);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [onScan]);

    return (
        <div className="relative w-full max-w-md mx-auto bg-slate-800 rounded-xl shadow-lg p-4">
            <p className="text-white text-center mb-2">Point camera at QR code</p>
            <div className="relative w-full aspect-square overflow-hidden rounded-lg">
                <video ref={videoRef} className="w-full h-full object-cover" />
                <div className="absolute inset-0 border-4 border-dashed border-white/50 rounded-lg animate-pulse"></div>
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <button onClick={onCancel} className="mt-4 w-full py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium hover:bg-slate-50 focus:outline-none">
                Cancel Scan
            </button>
        </div>
    );
};

export default App;
