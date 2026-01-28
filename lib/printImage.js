// Utility to open a print-ready window for an image and trigger the browser print dialog.
// Tries to set @page size to A5 and zero margins; Chrome mostly respects this for print preview.
export default function printImage(imageUrl, orientation = 'portrait') {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez les popups.');
      return;
    }

    const pageOrientation = orientation === 'landscape' ? 'landscape' : 'portrait';
    // Note: browsers and printers may still enforce non-printable margins or show headers/footers.
    // This helper sets the document to A5 and lays out the image full-bleed (cover). That
    // minimizes visible borders. True borderless printing requires printer support / user settings.
    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>Impression</title>
          <style>
            /* Page setup */
            @page { size: A5 ${pageOrientation}; margin: 0; }
            html, body { height: 100%; margin: 0; padding: 0; }

            /* Root container fills the whole page */
            .print-root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #fff; }

            /* Image is absolute and covers entire page to create a full-bleed effect. */
            .print-img {
              position: absolute;
              inset: 0; /* top:0; right:0; bottom:0; left:0 */
              width: 100%;
              height: 100%;
              object-fit: cover; /* cover to fill page; may crop to preserve aspect ratio */
              display: block;
              border: none;
              box-shadow: none;
              -webkit-print-color-adjust: exact;
            }

            /* Remove any focus outlines */
            * { outline: none !important; }

            /* Print-specific tweaks */
            @media print {
              html, body { margin: 0; padding: 0; }
              .print-root { background: transparent; }
              .print-img { object-fit: cover; }
            }
          </style>
        </head>
        <body>
          <div class="print-root">
            <img class="print-img" src="${imageUrl}" alt="Photo" />
          </div>
          <script>
            function doPrint() {
              try {
                window.focus();
                // Some browsers (Chrome) require a short delay to layout large images
                window.print();
              } catch (e) {
                console.error('Print error', e);
              }
            }
            // Wait for image load, then trigger print
            var img = document.querySelector('.print-img');
            if (img.complete) {
              setTimeout(doPrint, 150);
            } else {
              img.onload = function() { setTimeout(doPrint, 150); };
              img.onerror = function() { setTimeout(doPrint, 200); };
            }
            // Close the window a bit after print completes (user may cancel) - give user time
            window.onafterprint = function() { setTimeout(function() { try { window.close(); } catch(e){} }, 300); };
          <\/script>
        </body>
      </html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } catch (err) {
    console.error('printImage failed', err);
    alert('Erreur lors de la préparation de l\'impression.');
  }
}
