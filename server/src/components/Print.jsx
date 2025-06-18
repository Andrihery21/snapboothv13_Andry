import React, { useState } from 'react'

export function Print({ image, onClose }) {
  const [copies, setCopies] = useState(1)
  const [printing, setPrinting] = useState(false)
  const [error, setError] = useState('')

  const handlePrint = async () => {
    try {
      setPrinting(true)
      setError('')

      // Simuler l'impression
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      onClose()
    } catch (err) {
      setError('Erreur lors de l\'impression')
    } finally {
      setPrinting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl w-96">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Imprimer</h2>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Nombre de copies</label>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setCopies(1)}
              className={`w-16 h-16 text-2xl rounded-full border-2 ${
                copies === 1 
                  ? 'border-purple-600 bg-purple-600 text-white' 
                  : 'border-gray-300 text-gray-600 hover:border-purple-600'
              }`}
            >
              1
            </button>
            <button
              onClick={() => setCopies(2)}
              className={`w-16 h-16 text-2xl rounded-full border-2 ${
                copies === 2 
                  ? 'border-purple-600 bg-purple-600 text-white' 
                  : 'border-gray-300 text-gray-600 hover:border-purple-600'
              }`}
            >
              2
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Annuler
          </button>
          <button
            onClick={handlePrint}
            disabled={printing}
            className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
          >
            {printing ? 'Impression...' : 'Imprimer'}
          </button>
        </div>
      </div>
    </div>
  )
}