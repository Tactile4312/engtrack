import { useState } from 'react';
import { Copy, Download, FileSpreadsheet } from 'lucide-react';
import { Button, Modal } from './ui';
import { download, toCSV, type Cell } from '../lib/exporting';

export function ExportModal({ title, filename, header, rows, onClose }: { title: string; filename: string; header: string[]; rows: Cell[][]; onClose: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const csv = toCSV(header, rows);
  const save = (name: string) => setMsg(download(name, csv) ? `Download started: ${name}. If nothing appears, this preview blocks downloads; use Copy instead.` : 'This preview cannot save files. Use Copy instead, or open the prototype file on your computer.');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(csv.replace(/^﻿/, ''));
      setMsg('Copied. Paste into Excel or Google Sheets.');
    } catch {
      setMsg('Copy is blocked here. Select the preview text below and copy it by hand.');
    }
  };
  return (
    <Modal title={title} onClose={onClose} wide footer={<Button onClick={onClose}>Close</Button>}>
      <p className="text-[13px] text-ink-2">
        Exports the <b>{rows.length}</b> rows that match your current filters, limited to the projects you are allowed to see.
        CRM numbers and dates are written as text so Excel keeps their format.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Button kind="primary" onClick={() => save(`${filename}.csv`)}><Download size={16} />CSV</Button>
        <Button onClick={() => save(`${filename}-excel.csv`)}><FileSpreadsheet size={16} />Excel (.csv)</Button>
        <Button onClick={copy}><Copy size={16} />Copy</Button>
      </div>
      {msg && <p className="mt-3 rounded-md bg-paper px-3 py-2 text-[12.5px] text-ink" role="status">{msg}</p>}
      <p className="mt-4 text-[12px] font-medium text-ink-2">Preview</p>
      <textarea readOnly id="export-preview" className="mt-1 h-40 w-full rounded-md border border-line bg-paper p-2 font-mono text-[11px] text-ink" value={csv.replace(/^﻿/, '')} />
      <p className="mt-2 text-[11.5px] text-ink-3">Prototype: PDF export and printable summaries come with the full build.</p>
    </Modal>
  );
}
