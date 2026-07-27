const getBaseStyles = () => `
*,
*::before,
*::after{
    box-sizing:border-box;
}

@page{
    size:A4 portrait;
    margin:7mm;
}

html{
    margin:0;
    padding:0;
    width:100%;
    min-width:0;
    background:#FFFFFF;
    -webkit-text-size-adjust:100%;
    text-size-adjust:100%;
}

body{
    margin:0;
    padding:0;
    width:100%;
    min-width:0;
    background:#FFFFFF;
    color:#1F2D3D;
    font-family:Arial,Helvetica,sans-serif;
    font-size:11pt;
    line-height:1.4;
    font-variant-numeric:tabular-nums;
    -webkit-font-smoothing:antialiased;
    -moz-osx-font-smoothing:grayscale;
    text-rendering:optimizeLegibility;
}

.document{
    display:block;
    width:100%;
    max-width:100%;
    margin:0;
    padding:0;
    background:#FFFFFF;
}

.header{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:20px;
    width:100%;
    padding-bottom:12px;
    margin-bottom:14px;
    border-bottom:3px solid #B99652;
    break-inside:avoid;
    page-break-inside:avoid;
}

.header > div:first-child{
    flex:1 1 auto;
    min-width:0;
}

.logo{
    display:block;
    width:175px;
    max-width:100%;
    height:auto;
    object-fit:contain;
}

.brand-name{
    margin:0;
    color:#13233A;
    font-size:25pt;
    line-height:1;
    font-weight:800;
    letter-spacing:1.5px;
    overflow-wrap:break-word;
    word-break:normal;
}

.brand-subtitle{
    margin-top:6px;
    color:#8E6E33;
    font-size:10pt;
    font-weight:600;
    line-height:1.25;
    text-transform:uppercase;
    letter-spacing:.65px;
}

.company-info{
    margin-top:9px;
    color:#3F4D5E;
    font-size:9.5pt;
    line-height:1.45;
    overflow-wrap:break-word;
    word-break:normal;
}

.document-title{
    flex:0 0 220px;
    min-width:0;
    text-align:right;
}

.document-title h1{
    margin:0;
    color:#13233A;
    font-size:18pt;
    line-height:1.15;
    font-weight:800;
    text-transform:uppercase;
    letter-spacing:.4px;
    overflow-wrap:break-word;
    word-break:normal;
}

.document-number{
    margin-top:7px;
    color:#9B7536;
    font-size:11pt;
    line-height:1.3;
    font-weight:700;
    overflow-wrap:break-word;
    word-break:normal;
}

.document-title strong{
    color:#13233A;
}

.section{
    display:block;
    width:100%;
    margin-top:13px;
    break-inside:auto;
    page-break-inside:auto;
}

.section:first-child{
    margin-top:0;
}

.section-title{
    display:block;
    width:100%;
    margin:0 0 7px;
    padding:7px 10px;
    background:#13233A;
    color:#FFFFFF;
    font-size:10.5pt;
    line-height:1.25;
    font-weight:700;
    text-transform:uppercase;
    letter-spacing:.35px;
    break-after:avoid;
    page-break-after:avoid;
    print-color-adjust:exact;
    -webkit-print-color-adjust:exact;
}

.info-grid{
    display:grid;
    grid-template-columns:minmax(0,1fr) minmax(0,1fr);
    width:100%;
    border-top:1px solid #CBD2DA;
    border-left:1px solid #CBD2DA;
    break-inside:avoid;
    page-break-inside:avoid;
}

.info-item{
    min-width:0;
    min-height:42px;
    padding:8px 10px;
    border-right:1px solid #CBD2DA;
    border-bottom:1px solid #CBD2DA;
    color:#1F2D3D;
    font-size:10.5pt;
    line-height:1.35;
    overflow-wrap:break-word;
    word-break:normal;
}

.info-item strong{
    display:block;
    margin:0 0 3px;
    color:#526071;
    font-size:9pt;
    line-height:1.2;
    font-weight:700;
    text-transform:uppercase;
    letter-spacing:.25px;
}

table{
    width:100%;
    max-width:100%;
    margin:0;
    border-spacing:0;
    border-collapse:collapse;
    table-layout:fixed;
    font-size:10.5pt;
}

thead{
    display:table-header-group;
}

tbody{
    display:table-row-group;
}

tfoot{
    display:table-footer-group;
}

tr{
    break-inside:avoid;
    page-break-inside:avoid;
}

th,
td{
    min-width:0;
    border:1px solid #CBD2DA;
    overflow-wrap:break-word;
    word-break:normal;
    hyphens:none;
}

th{
    padding:7px 5px;
    background:#E7EBF0;
    color:#13233A;
    font-size:9.2pt;
    line-height:1.2;
    font-weight:800;
    text-align:left;
    text-transform:uppercase;
    vertical-align:middle;
    print-color-adjust:exact;
    -webkit-print-color-adjust:exact;
}

td{
    padding:7px 5px;
    background:#FFFFFF;
    color:#1F2D3D;
    font-size:10pt;
    line-height:1.35;
    vertical-align:top;
}

tbody tr:nth-child(even) td{
    background:#FAFBFC;
    print-color-adjust:exact;
    -webkit-print-color-adjust:exact;
}

th:first-child,
td:first-child{
    text-align:center;
}

.center{
    text-align:center;
}

.number{
    text-align:right;
    white-space:normal;
    font-variant-numeric:tabular-nums;
}

.number strong{
    display:inline-block;
    font-weight:800;
}

.product-name{
    color:#13233A;
    font-size:10.8pt;
    line-height:1.3;
    font-weight:800;
    overflow-wrap:break-word;
    word-break:normal;
}

.product-room{
    margin-top:3px;
    color:#8E6E33;
    font-size:10pt;
    line-height:1.3;
    font-weight:700;
    overflow-wrap:break-word;
    word-break:normal;
}

.details{
    margin-top:5px;
    color:#2F3D4D;
    font-size:9.5pt;
    line-height:1.4;
    overflow-wrap:break-word;
    word-break:normal;
}

.detail{
    margin-top:3px;
    break-inside:avoid;
    page-break-inside:avoid;
}

.detail:first-child{
    margin-top:0;
}

.detail span{
    color:#13233A;
    font-weight:800;
}

.dimension-line{
    display:block;
    margin:0 0 3px;
    color:#1F2D3D;
    font-size:9.5pt;
    line-height:1.35;
    white-space:nowrap;
    font-variant-numeric:tabular-nums;
}

.dimension-line:last-child{
    margin-bottom:0;
}

.production-table{
    width:100%;
    max-width:100%;
    font-size:10pt;
}

.production-table th{
    padding:7px 5px;
    font-size:9pt;
    line-height:1.2;
}

.production-table td{
    padding:7px 5px;
    font-size:9.7pt;
    line-height:1.35;
}

.production-table .product-name{
    font-size:10.5pt;
}

.production-table .details{
    color:#263648;
    font-size:9.3pt;
    line-height:1.4;
}

.production-table .dimension-line{
    font-size:9.3pt;
}

.production-table tr{
    break-inside:avoid;
    page-break-inside:avoid;
}
.totals{
    width:340px;
    max-width:100%;
    margin:16px 0 0 auto;
    border:1px solid #CBD2DA;
    border-bottom:none;
    break-inside:avoid;
    page-break-inside:avoid;
}

.total-row{
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:16px;
    padding:8px 12px;
    border-bottom:1px solid #CBD2DA;
    color:#1F2D3D;
    font-size:10.5pt;
    line-height:1.35;
}

.total-row span:last-child{
    white-space:nowrap;
    font-variant-numeric:tabular-nums;
}

.total-row.grand-total{
    background:#13233A;
    color:#FFFFFF;
    font-size:12pt;
    font-weight:800;
    print-color-adjust:exact;
    -webkit-print-color-adjust:exact;
}

.total-row.remaining{
    color:#8E6E33;
    font-size:11pt;
    font-weight:800;
}

.notes{
    width:100%;
    min-height:70px;
    padding:10px;
    border:1px solid #CBD2DA;
    color:#1F2D3D;
    font-size:10.5pt;
    line-height:1.45;
    white-space:pre-wrap;
    overflow-wrap:break-word;
    word-break:normal;
}

.signatures{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:70px;
    width:100%;
    margin-top:45px;
    break-inside:avoid;
    page-break-inside:avoid;
}

.signature{
    padding-top:8px;
    border-top:1px solid #526071;
    color:#3F4D5E;
    font-size:10pt;
    line-height:1.3;
    text-align:center;
}

.footer{
    margin-top:20px;
    padding-top:8px;
    border-top:1px solid #CBD2DA;
    color:#5F6C7A;
    font-size:8.8pt;
    line-height:1.35;
    text-align:center;
}

.qr{
    width:88px;
    height:88px;
    object-fit:contain;
}

.badge{
    display:inline-block;
    padding:4px 10px;
    border-radius:999px;
    background:#13233A;
    color:#FFFFFF;
    font-size:9pt;
    line-height:1.2;
    font-weight:700;
    letter-spacing:.35px;
    print-color-adjust:exact;
    -webkit-print-color-adjust:exact;
}

hr.separator{
    margin:18px 0;
    border:none;
    border-top:1px solid #CBD2DA;
}

img{
    max-width:100%;
}

strong{
    font-weight:700;
}

@media screen{

    html{
        background:#ECEFF3;
    }

    body{
        width:210mm;
        min-height:297mm;
        margin:12px auto;
        padding:10mm;
        background:#ECEFF3;
    }

    .document{
        background:#FFFFFF;
        padding:10mm;
        box-shadow:0 4px 24px rgba(0,0,0,.14);
    }

}

@media print{

    html,
    body{
        width:100%;
        min-width:0;
        margin:0;
        padding:0;
        background:#FFFFFF;
    }

    body{
        print-color-adjust:exact;
        -webkit-print-color-adjust:exact;
    }

    .document{
        width:100%;
        max-width:100%;
        margin:0;
        padding:0;
        box-shadow:none;
    }

    table{
        width:100%;
        max-width:100%;
    }

    thead{
        display:table-header-group;
    }

    tfoot{
        display:table-footer-group;
    }

    tr,
    td,
    th,
    .section,
    .header,
    .info-grid,
    .totals,
    .signatures{
        break-inside:avoid;
        page-break-inside:avoid;
    }

    .no-print{
        display:none!important;
    }

}

`;

export default getBaseStyles;
