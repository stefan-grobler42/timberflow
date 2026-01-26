import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface PdfExportOptions {
  filename: string;
  title: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'a3' | 'letter';
  margin?: number;
}

export async function exportElementToPdf(
  element: HTMLElement,
  options: PdfExportOptions
): Promise<void> {
  const {
    filename,
    title,
    subtitle,
    orientation = 'landscape',
    format = 'a4',
    margin = 10
  } = options;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const headerHeight = 20;
    const footerHeight = 10;
    const contentMargin = margin;
    
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text(title, contentMargin, 12);
    
    if (subtitle) {
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(subtitle, contentMargin, 18);
    }
    
    pdf.setDrawColor(200, 200, 200);
    pdf.line(contentMargin, headerHeight, pageWidth - contentMargin, headerHeight);
    
    const availableWidth = pageWidth - (contentMargin * 2);
    const availableHeight = pageHeight - headerHeight - footerHeight - (contentMargin * 2);
    
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const aspectRatio = imgWidth / imgHeight;
    
    let finalWidth = availableWidth;
    let finalHeight = finalWidth / aspectRatio;
    
    if (finalHeight > availableHeight) {
      finalHeight = availableHeight;
      finalWidth = finalHeight * aspectRatio;
    }
    
    const xOffset = contentMargin + (availableWidth - finalWidth) / 2;
    const yOffset = headerHeight + contentMargin;
    
    pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
    
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    pdf.text(`Generated: ${dateStr}`, contentMargin, pageHeight - 5);
    pdf.text('Millennium Timber Roof ERP', pageWidth - contentMargin - 50, pageHeight - 5);
    
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
}

export async function exportPlannerViewToPdf(
  containerId: string,
  viewMode: 'month' | 'week' | 'day',
  dateInfo: string
): Promise<void> {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error('Planner container not found');
  }

  const viewNames = {
    month: 'Monthly View',
    week: 'Weekly View',
    day: 'Daily View'
  };

  await exportElementToPdf(container, {
    filename: `production-planner-${viewMode}-${dateInfo.replace(/[^a-zA-Z0-9]/g, '-')}`,
    title: `Production Planner - ${viewNames[viewMode]}`,
    subtitle: dateInfo,
    orientation: viewMode === 'day' ? 'portrait' : 'landscape',
    format: 'a4'
  });
}
