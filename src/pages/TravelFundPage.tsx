import { useState } from 'react';
export function TravelFundPage() {
  const [showDetails, setShowDetails] = useState(false);
  return <section aria-labelledby="travel-fund-heading">
    <p className="eyebrow">EVERGREEN BANKING</p>
    <h1 id="travel-fund-heading">Travel Fund</h1>
    <p>A fresh start for your next banking idea.</p>
    <button type="button" data-testid="performance-action" aria-expanded={showDetails} aria-controls="travel-fund-details" onClick={() => setShowDetails((value) => !value)}>Toggle details</button>
    <p id="travel-fund-details" hidden={!showDetails}>Your new page is ready to customize.</p>
  </section>;
}
