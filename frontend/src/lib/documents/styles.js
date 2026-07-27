const getBaseStyles = () => `
*{
    box-sizing:border-box;
}

@page{
    size:A4 landscape;
    margin:8mm;
}

html,
body{
    margin:0;
    padding:0;
    width:100%;
    background:#fff;
}

body{
    color:#15243a;
    font-family:Arial,Helvetica,sans-serif;
    font-size:10.5pt;
    line-height:1.4;
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
    gap:20px;
    border-bottom:3px solid #B99652;
    padding-bottom:12px;
    margin-bottom:14px;
    page-break-inside:avoid;
}

.header > div:first-child{
    flex:1;
    min-width:0;
}

.brand-name{
    font-size:24pt;
    line-height:1;
    font-weight:800;
    letter-spacing:1.5px;
    color:#13233A;
}

.brand-subtitle{
    margin-top:6px;
    color:#8E6E33;
    font-size:9pt;
    text-transform:uppercase;
    letter-spacing:.7px;
}

.company-info{
    margin-top:9px;
    color:#526071;
    font-size:9pt;
    line-height:1.45;
}

.document-title{
    flex:0 0 220px;
    text-align:right;
}

.document-title h1{
    margin:0;
    color:#13233A;
    font-size:17pt;
    line-height:1.15;
    text-transform:uppercase;
    letter-spacing:.5px;
}

.document-number{
    margin-top:7px;
    font-size:10pt;
    font-weight:700;
    color:#B28A43;
}

.section{
    margin-top:13px;
    page-break-inside:auto;
}

.section-title{
    margin-bottom:7px;
    padding:6px 9px;
    background:#13233A;
    color:#fff;
    font-size:10pt;
    font-weight:700;
    text-transform:uppercase;
    letter-spacing:.4px;
    page-break-after:avoid;
}

.info-grid{
    display:grid;
    grid-template-columns:1fr 1fr;
    border:1px solid #D9DEE5;
    page-break-inside:avoid;
}

.info-item{
    min-height:40px;
    padding:7px 9px;
    border-bottom:1px solid #D9DEE5;
    font-size:10pt;
}

.info-item:nth-child(odd){
    border-right:1px solid #D9DEE5;
}

.info-item strong{
    display:block;
    margin-bottom:2px;
    color:#697587;
    font-size:8.5pt;
    text-transform:uppercase;
}

table{
    width:100%;
    max-width:100%;
    border-collapse:collapse;
    table-layout:fixed;
    font-size:9.5pt;
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
    padding:6px 5px;
    background:#EDF0F4;
    border:1px solid #D3D9E1;
    color:#13233A;
    font-size:8.5pt;
    line-height:1.25;
    text-align:left;
    text-transform:uppercase;
    vertical-align:middle;
    overflow-wrap:anywhere;
    word-break:normal;
}

td{
    padding:6px 5px;
    border:1px solid #D9DEE5;
    vertical-align:top;
    font-size:9.5pt;
    line-height:1.35;
    overflow-wrap:anywhere;
    word-break:normal;
}

.center{
    text-align:center;
}

.number{
    text-align:right;
    white-space:normal;
}

.product-name{
    font-weight:700;
    color:#13233A;
}

.product-room{
    margin-top:3px;
    color:#8E6E33;
    font-size:9pt;
    font-weight:600;
}

.details{
    margin-top:5px;
    color:#526071;
    font-size:8.5pt;
    line-height:1.35;
}

.detail{
    margin-top:2px;
}

.detail span{
    font-weight:700;
}

.totals{
    width:300px;
    max-width:100%;
    margin:14px 0 0 auto;
    page-break-inside:avoid;
}

.total-row{
    display:flex;
    justify-content:space-between;
    gap:15px;
    padding:6px 10px;
    border-bottom:1px solid #D9DEE5;
    font-size:10pt;
}

.total-row.grand-total{
    background:#13233A;
    color:#fff;
    font-size:12pt;
    font-weight:700;
    padding-top:8px;
    padding-bottom:8px;
}

.total-row.remaining{
    color:#8E6E33;
    font-size:11pt;
    font-weight:700;
}

.notes{
    min-height:60px;
    padding:9px;
    border:1px solid #D9DEE5;
    font-size:10pt;
    line-height:1.4;
    white-space:pre-wrap;
}

.signatures{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:70px;
    margin-top:45px;
    page-break-inside:avoid;
}

.signature{
    padding-top:8px;
    border-top:1px solid #697587;
    text-align:center;
    color:#526071;
    font-size:9.5pt;
}

.footer{
    margin-top:22px;
    padding-top:7px;
    border-top:1px solid #D9DEE5;
    color:#7A8593;
    font-size:8pt;
    line-height:1.3;
    text-align:center;
}

.logo{
    display:block;
    width:155px;
    max-width:100%;
    height:auto;
}

.qr{
    width:85px;
    height:85px;
}

.badge{
    display:inline-block;
    padding:4px 9px;
    border-radius:30px;
    background:#13233A;
    color:#fff;
    font-size:8.5pt;
    font-weight:700;
    letter-spacing:.4px;
}

hr.separator{
    border:none;
    border-top:1px solid #D9DEE5;
    margin:16px 0;
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

    .no-print{
        display:none!important;
    }
}
`;

export default getBaseStyles;
