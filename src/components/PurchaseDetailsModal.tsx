@@ .. @@
      <div 
        ref={modalRef}
        className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4"
      />
      
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl mx-4 z-[60]">
        <div className="rounded-lg p-6 animate-[modalPopIn_0.3s_ease-out_forwards] app-card">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-white">
              Purchase Details
            </h2>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 rounded-lg group z-[70] hover:bg-white/10"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 transition-colors text-white group-hover:opacity-80" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl app-card">
              <Coins className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-3">
              <DetailRow label="Tokens Purchased" value={`${purchase.tokens} Tokens`} className="text-white" />
              <DetailRow label="Price" value={`$${purchase.amount.toFixed(2)} USD`} className="text-white" />
              <DetailRow 
                label="Purchase Date" 
                value={new Date(purchase.date).toLocaleString()} 
                className="text-white"
              />
              <DetailRow label="Status" value={purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)} className="text-white" />
            </div>
          </div>
        </div>
      </div>