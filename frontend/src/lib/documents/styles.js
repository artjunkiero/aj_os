const getBaseStyles = () => `
*{
    box-sizing:border-box;
}

@page{
    size:A4 portrait;
    margin:7mm;
}

html,
body{
    margin:0;
    padding:0;
    width:100%;
    background:#FFFFFF;
}

body{
    color:#1F2D3D;
    font-family:Arial,Helvetica,sans-serif;
    font-size:12pt;
    line-height:1.42;
    -webkit-font-smoothing:antialiased;
    text-rendering:optimizeLegibility;
}

.document{
    width:100%;
    max-width:100%;
    margin:0;
    padding:0;
}

.header{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:24px;
    padding-bottom:12px;
    margin-bottom:14px;
    border-bottom:3px solid #B99652;
    page-break-inside:avoid;
}

.header > div:first-child{
    flex:1;
    min-width:0;
}

.logo{
    display:block;
    width:175px;
    max-width:100%;
    height:auto;
}

.brand-name{
    margin:0;
    color:#13233A;
    font-size:25pt;
    line-height:1;
    font-weight:800;
    letter-spacing:1.5px;
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
    font-size:10pt;
    line-height:1.45;
}

.document-title{
    flex:0 0 235px;
    text-align:right;
}

.document-title h1{
    margin:0;
    color:#13233A;
    font-size:19pt;
    line-height:1.15;
    font-weight:800;
    text-transform:uppercase;
    letter-spacing:.45px;
}

.document-number{
    margin-top:7px;
    color:#9B7536;
    font-size:11.5pt;
    font-weight:700;
}

.document-title strong{
    color:#13233A;
}

.section{
    margin-top:13px;
    page-break-inside:auto;
}

.section-title{
    margin-bottom:7px;
    padding:7px 10px;
    background:#13233A;
    color:#FFFFFF;
    font-size:11pt;
    line-height:1.2;
    font-weight:700;
    text-transform:uppercase;
    letter-spacing:.35px;
    page-break-after:avoid;
}

.info-grid{
    display:grid;
    grid-template-columns:1fr 1fr;
    border:1px solid #CBD2DA;
    page-break-inside:avoid;
}

.info-item{
    min-height:42px;
    padding:8px 10px;
    border-bottom:1px solid #CBD2DA;
    color:#1F2D3D;
    font-size:11pt;
    line-height:1.35;
}

.info-item:nth-child(odd){
    border-right:1px solid #CBD2DA;
}

.info-item strong{
    display:block;
    margin-bottom:3px;
    color:#526071;
    font-size:9.5pt;
    line-height:1.2;
    font-weight:700;
    text-transform:uppercase;
    letter-spacing:.25px;
}

table{
    width:100%;
    max-width:100%;
    border-collapse:collapse;
    table-layout:fixed;
    font-size:11pt;
}

thead{
    display:table-header-group;
}

tfoot{
    display:table-footer-group;
}

tr{
    page-break-inside:avoid;
}

th{
    padding:8px 6px;
    background:#E7EBF0;
    border:1px solid #BFC8D2;
    color:#13233A;
    font-size:10pt;
    line-height:1.25;
    font-weight:800;
    text-align:left;
    text-transform:uppercase;
    vertical-align:middle;
    overflow-wrap:anywhere;
}

td{
    padding:8px 6px;
    border:1px solid #CBD2DA;
    color:#1F2D3D;
    font-size:11pt;
    line-height:1.4;
    vertical-align:top;
    overflow-wrap:anywhere;
}

tbody tr:nth-child(even) td{
    background:#FAFBFC;
}

.center{
    text-align:center;
}

.number{
    text-align:right;
    white-space:normal;
}

.product-name{
    color:#13233A;
    font-size:11.5pt;
    line-height:1.3;
    font-weight:800;
}

.product-room{
    margin-top:3px;
    color:#8E6E33;
    font-size:10.5pt;
    line-height:1.3;
    font-weight:700;
}

.details{
    margin-top:0;
    color:#2F3D4D;
    font-size:10.5pt;
    line-height:1.45;
}

.detail{
    margin-top:3px;
}

.detail:first-child{
    margin-top:0;
}

.detail span{
    color:#13233A;
    font-weight:800;
}

.production-table{
    font-size:11pt;
}

.production-table th{
    font-size:10pt;
}

.production-table td{
    font-size:11pt;
}

.production-table .product-name{
    font-size:11.5pt;
}

.production-table .details{
    color:#263648;
    font-size:10.5pt;
    line-height:1.45;
}

.totals{
    width:340px;
    max-width:100%;
    margin:15px 0 0 auto;
    page-break-inside:avoid;
}

.total-row{
    display:flex;
    justify-content:space-between;
    gap:18px;
    padding:7px 11px;
    border-bottom:1px solid #CBD2DA;
    color:#1F2D3D;
    font-size:11pt;
    line-height:1.3;
}

.total-row.grand-total{
    padding-top:9px;
    padding-bottom:9px;
    background:#13233A;
    color:#FFFFFF;
    font-size:13pt;
    font-weight:800;
}

.total-row.remaining{
    color:#8E6E33;
    font-size:12pt;
    font-weight:800;
}

.notes{
    min-height:65px;
    padding:10px;
    border:1px solid #CBD2DA;
    color:#1F2D3D;
    font-size:11pt;
    line-height:1.45;
    white-space:pre-wrap;
}

.signatures{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:80px;
    margin-top:48px;
    page-break-inside:avoid;
}

.signature{
    padding-top:9px;
    border-top:1px solid #526071;
    color:#3F4D5E;
    font-size:10.5pt;
    line-height:1.3;
    text-align:center;
}

.footer{
    margin-top:22px;
    padding-top:8px;
    border-top:1px solid #CBD2DA;
    color:#5F6C7A;
    font-size:9pt;
    line-height:1.35;
    text-align:center;
}

.qr{
    width:88px;
    height:88px;
}

.badge{
    display:inline-block;
    padding:4px 10px;
    border-radius:30px;
    background:#13233A;
    color:#FFFFFF;
    font-size:9.5pt;
    line-height:1.2;
    font-weight:700;
    letter-spacing:.35px;
}

hr.separator{
    margin:17px 0;
    border:none;
    border-top:1px solid #CBD2DA;
}

@media print{
    html,
    body{
        width:100%;
        min-width:0;
    }

    body{
        print-color-adjust:exact;
        -webkit-print-color-adjust:exact;
    }

    .document{
        width:100%;
        max-width:100%;
    }

    table{
        width:100%;
        max-width:100%;
    }

    .no-print{
        display:none!important;
    }
}
`;

export default getBaseStyles;
