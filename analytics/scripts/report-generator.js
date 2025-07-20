const fs = require('fs').promises;
const path = require('path');
const PDFDocument = require('pdfkit');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

class ReportGenerator {
  constructor() {
    this.chartRenderer = new ChartJSNodeCanvas({ width: 800, height: 400 });
  }

  async generatePDFReport(data, outputPath) {
    const doc = new PDFDocument();
    const stream = doc.pipe(fs.createWriteStream(outputPath));

    // Title Page
    doc.fontSize(24).text('AI Debate Coach Analytics Report', 50, 50);
    doc.fontSize(14).text(`Generated: ${new Date().toLocaleDateString()}`, 50, 100);
    doc.fontSize(12).text(`Period: ${data.period.start.toLocaleDateString()} - ${data.period.end.toLocaleDateString()}`, 50, 130);

    // Executive Summary
    doc.addPage();
    doc.fontSize(18).text('Executive Summary', 50, 50);
    doc.fontSize(12);
    doc.text(`Total Users: ${data.userMetrics.totalUsers}`, 50, 100);
    doc.text(`Active Users: ${data.userMetrics.activeUsers}`, 50, 120);
    doc.text(`Average User Level: ${data.userMetrics.averageLevel.toFixed(1)}`, 50, 140);

    // User Growth Chart
    if (data.debateMetrics.length > 0) {
      const chartImage = await this.generateChart({
        type: 'line',
        data: {
          labels: data.debateMetrics.map(d => d._id.date),
          datasets: [{
            label: 'Daily Debates',
            data: data.debateMetrics.map(d => d.count),
            borderColor: 'rgb(37, 99, 235)',
            tension: 0.4
          }]
        }
      });
      
      doc.addPage();
      doc.fontSize(18).text('Debate Activity', 50, 50);
      doc.image(chartImage, 50, 100, { width: 500 });
    }

    // Topic Popularity
    doc.addPage();
    doc.fontSize(18).text('Topic Popularity', 50, 50);
    doc.fontSize(12);
    
    let yPos = 100;
    data.topicPopularity.slice(0, 10).forEach((topic, index) => {
      doc.text(`${index + 1}. ${topic.title} - ${topic.debateCount} debates (Avg Score: ${topic.avgScore})`, 50, yPos);
      yPos += 20;
    });

    // Skill Improvement Analysis
    doc.addPage();
    doc.fontSize(18).text('Average Skill Improvement', 50, 50);
    
    const avgImprovement = this.calculateAverageImprovement(data.skillProgression);
    doc.fontSize(12);
    doc.text(`Argumentation: +${avgImprovement.argumentation.toFixed(1)}%`, 50, 100);
    doc.text(`Delivery: +${avgImprovement.delivery.toFixed(1)}%`, 50, 120);
    doc.text(`Rebuttal: +${avgImprovement.rebuttal.toFixed(1)}%`, 50, 140);
    doc.text(`Structure: +${avgImprovement.structure.toFixed(1)}%`, 50, 160);

    doc.end();
    await new Promise(resolve => stream.on('finish', resolve));
    
    console.log(`PDF report generated: ${outputPath}`);
  }

  async generateChart(config) {
    const configuration = {
      ...config,
      options: {
        ...config.options,
        plugins: {
          ...config.options?.plugins,
          legend: {
            display: true
          }
        }
      }
    };

    const imageBuffer = await this.chartRenderer.renderToBuffer(configuration);
    return imageBuffer;
  }

  calculateAverageImprovement(progressionData) {
    const improvements = {
      argumentation: 0,
      delivery: 0,
      rebuttal: 0,
      structure: 0
    };

    progressionData.forEach(user => {
      if (user.totalDebates >= 5) { // Only count users with 5+ debates
        improvements.argumentation += user.improvement.argumentation || 0;
        improvements.delivery += user.improvement.delivery || 0;
        improvements.rebuttal += user.improvement.rebuttal || 0;
        improvements.structure += user.improvement.structure || 0;
      }
    });

    const validUsers = progressionData.filter(u => u.totalDebates >= 5).length;
    
    Object.keys(improvements).forEach(key => {
      improvements[key] = validUsers > 0 ? improvements[key] / validUsers : 0;
    });

    return improvements;
  }

  async generateHTMLReport(data, outputPath) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>AI Debate Coach Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #2563eb; }
          .metric { display: inline-block; margin: 20px; padding: 20px; background: #f5f5f5; border-radius: 8px; }
          .metric-value { font-size: 2em; font-weight: bold; color: #10b981; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; }
        </style>
      </head>
      <body>
        <h1>AI Debate Coach Analytics Report</h1>
        <p>Generated: ${new Date().toLocaleDateString()}</p>
        
        <h2>Key Metrics</h2>
        <div class="metric">
          <div class="metric-value">${data.userMetrics.totalUsers}</div>
          <div>Total Users</div>
        </div>
        <div class="metric">
          <div class="metric-value">${data.userMetrics.activeUsers}</div>
          <div>Active Users</div>
        </div>
        
        <h2>Top Topics</h2>
        <table>
          <tr>
            <th>Topic</th>
            <th>Category</th>
            <th>Debates</th>
            <th>Avg Score</th>
          </tr>
          ${data.topicPopularity.slice(0, 10).map(topic => `
            <tr>
              <td>${topic.title}</td>
              <td>${topic.category}</td>
              <td>${topic.debateCount}</td>
              <td>${topic.avgScore}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;

    await fs.writeFile(outputPath, html);
    console.log(`HTML report generated: ${outputPath}`);
  }

  async generateCSVReport(data, outputPath) {
    const csv = [
      ['Metric', 'Value'],
      ['Total Users', data.userMetrics.totalUsers],
      ['Active Users', data.userMetrics.activeUsers],
      ['Average Level', data.userMetrics.averageLevel],
      ['', ''],
      ['Daily Debate Activity', ''],
      ['Date', 'Count', 'Avg Score']
    ];

    data.debateMetrics.forEach(day => {
      csv.push([day._id.date, day.count, day.avgScore.toFixed(2)]);
    });

    const csvContent = csv.map(row => row.join(',')).join('\n');
    await fs.writeFile(outputPath, csvContent);
    
    console.log(`CSV report generated: ${outputPath}`);
  }
}

// CLI execution
if (require.main === module) {
  const generator = new ReportGenerator();
  const dataPath = process.argv[2];
  const format = process.argv[3] || 'pdf';

  if (!dataPath) {
    console.error('Usage: node report-generator.js <data-file> [format]');
    process.exit(1);
  }

  fs.readFile(dataPath, 'utf8')
    .then(content => JSON.parse(content))
    .then(data => {
      const baseName = path.basename(dataPath, '.json');
      
      switch (format) {
        case 'pdf':
          return generator.generatePDFReport(data, `${baseName}.pdf`);
        case 'html':
          return generator.generateHTMLReport(data, `${baseName}.html`);
        case 'csv':
          return generator.generateCSVReport(data, `${baseName}.csv`);
        default:
          throw new Error(`Unknown format: ${format}`);
      }
    })
    .catch(console.error);
}

module.exports = ReportGenerator;