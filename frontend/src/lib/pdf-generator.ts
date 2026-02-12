import jsPDF from "jspdf";

type PDFOptions = {
  content: string;
  title: string;
  employeeName: string;
  date: string;
};

export async function generatePDF({
  content,
  title,
  employeeName,
  date,
}: PDFOptions) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;

  // Header
  pdf.setFillColor(30, 41, 59); // slate-800
  pdf.rect(0, 0, pageWidth, 40, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.text(title, margin, 20);

  pdf.setFontSize(10);
  pdf.text(`Prepared for: ${employeeName}`, margin, 30);
  pdf.text(`Date: ${date}`, pageWidth - margin, 30, { align: "right" });

  // Content
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(11);

  const lines = pdf.splitTextToSize(content, maxWidth);
  let y = 50;

  lines.forEach((line: string) => {
    if (y > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += 7;
  });

  // Save
  pdf.save(`${title.replace(/\s+/g, "_")}_${date}.pdf`);
}
