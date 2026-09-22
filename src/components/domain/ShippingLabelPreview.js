// Presentational only — renders the courier-label layout described by the
// shipping-label feature. Used both for the on-screen preview and, via the
// `#shipping-label-print` id (see globals.css), as what actually prints.
export function ShippingLabelPreview({ label }) {
  if (!label) return null;

  return (
    <div
      id="shipping-label-print"
      className="mx-auto w-full max-w-sm rounded-xl border border-line-paper bg-white p-5 font-body text-ink print:rounded-none print:border-0 print:p-0 print:shadow-none"
    >
      <p className="text-center font-serif text-base font-semibold">{label.from.name}</p>

      <Section title="FROM">
        <AddressLines
          lines={[
            label.from.addressLine1,
            label.from.addressLine2,
            [label.from.city, label.from.state].filter(Boolean).join(", "),
            label.from.pincode,
          ]}
        />
        {label.from.phone && <p className="text-xs text-ink/70">Phone: {label.from.phone}</p>}
      </Section>

      <Divider />

      <Section title="SHIP TO">
        <p className="font-semibold">{label.to.name}</p>
        <AddressLines lines={[label.to.address, `${label.to.city}, ${label.to.state} - ${label.to.pincode}`]} />
        <p className="text-xs text-ink/70">Phone: {label.to.phone}</p>
      </Section>

      <Divider />

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <Row label="Order ID" value={`#${label.orderNumber}`} />
        <Row label="Shipment ID" value={label.shipmentId} mono />
        <Row label="Payment" value={label.paymentMethod} />
        <Row label="Amount" value={`₹${label.amount}`} />
        <Row label="Status" value={label.status} />
        {label.courierName && <Row label="Courier" value={label.courierName} />}
      </dl>

      <Divider />

      <Section title="PRODUCT(S)">
        <ul className="flex flex-col gap-1 text-xs">
          {label.items.map((item, i) => (
            <li key={i}>
              {item.name}
              {item.size ? ` · Size ${item.size}` : ""} · Qty {item.qty}
              {item.sku ? ` · SKU ${item.sku}` : ""}
            </li>
          ))}
        </ul>
      </Section>

      <Divider />

      <div className="flex flex-col items-center gap-1 py-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={label.qrDataUrl} alt="Shipment QR code" className="h-28 w-28" />
        <p className="text-[10px] uppercase tracking-wide text-ink/50">Scan for Shipment Details</p>
      </div>

      <div className="flex flex-col items-center gap-1 py-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={label.barcodeDataUrl} alt="Shipment barcode" className="w-full max-w-[240px]" />
      </div>

      <p className="pt-2 text-center text-[10px] text-ink/45">Handle with care</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="py-2">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink/45">{title}</p>
      {children}
    </div>
  );
}

function AddressLines({ lines }) {
  return lines.filter(Boolean).map((line, i) => (
    <p key={i} className="text-xs text-ink/80">
      {line}
    </p>
  ));
}

function Divider() {
  return <div className="my-1 border-t border-dashed border-line-paper" />;
}

function Row({ label, value, mono }) {
  return (
    <>
      <dt className="text-ink/50">{label}</dt>
      <dd className={mono ? "font-mono text-ink" : "text-ink"}>{value}</dd>
    </>
  );
}
