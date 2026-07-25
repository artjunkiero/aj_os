const getBaseStyles = () => `
*{
    box-sizing:border-box;
}

@page{
    size:A4;
    margin:12mm;
}

body{
    margin:0;
    padding:0;
    background:#fff;
    color:#15243a;
    font-family:Arial,Helvetica,sans-serif;
    font-size:11px;
    line-height:1.45;
}

.document{
    width:100%;
    margin:0 auto;
}

.header{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    border-bottom:3px solid #B99652;
    padding-bottom:14px;
    margin-bottom:18px;
}

.brand-name{
    font-size:25px;
    line-height:1;
    font-weight:800;
    letter-spacing:1.5px;
    color:#13233A;
}

.brand-subtitle{
    margin-top:6px;
    color:#8E6E33;
    font-size:10px;
    text-transform:uppercase;
    letter-spacing:.7px;
}

.company-info{
    margin-top:10px;
    color:#526071;
    line-height:1.55;
}

.document-title{
    text-align:right;
}

.document-title h1{
    margin:0;
    color:#13233A;
    font-size:19px;
    text-transform:uppercase;
    letter-spacing:.8px;
}

.document-number{
    margin-top:7px;
    font-weight:700;
    color:#B28A43;
}

.section{
    margin-top:16px;
    page-break-inside:avoid;
}

.section-title{
    margin-bottom:8px;
    padding:7px 10px;
    background:#13233A;
    color:#fff;
    font-weight:700;
    text-transform:uppercase;
    letter-spacing:.5px;
}

.info-grid{
    display:grid;
    grid-template-columns:1fr 1fr;
    border:1px solid #D9DEE5;
}

.info-item{
    min-height:42px;
    padding:8px 10px;
    border-bottom:1px solid #D9DEE5;
}

.info-item:nth-child(odd){
    border-right:1px solid #D9DEE5;
}

.info-item strong{
    display:block;
    margin-bottom:2px;
    color:#697587;
    font-size:9px;
    text-transform:uppercase;
}

table{
    width:100%;
    border-collapse:collapse;
}

thead{
    display:table-header-group;
}

tr{
    page-break-inside:avoid;
}

th{
    padding:8px 6px;
    background:#EDF0F4;
    border:1px solid #D3D9E1;
    color:#13233A;
    font-size:9px;
    text-align:left;
    text-transform:uppercase;
}

td{
    padding:8px 6px;
    border:1px solid #D9DEE5;
    vertical-align:top;
}

.center{
    text-align:center;
}

.number{
    text-align:right;
    white-space:nowrap;
}

.product-name{
    font-weight:700;
    color:#13233A;
}

.product-room{
    margin-top:3px;
    color:#8E6E33;
    font-weight:600;
}

.details{
    margin-top:5px;
    color:#526071;
    font-size:9px;
}

.detail{
    margin-top:2px;
}

.detail span{
    font-weight:700;
}

.totals{
    width:310px;
    margin:16px 0 0 auto;
}

.total-row{
    display:flex;
    justify-content:space-between;
    padding:6px 10px;
    border-bottom:1px solid #D9DEE5;
}

.total-row.grand-total{
    background:#13233A;
    color:#fff;
    font-size:13px;
    font-weight:700;
    padding-top:9px;
    padding-bottom:9px;
}

.total-row.remaining{
    color:#8E6E33;
    font-size:12px;
    font-weight:700;
}

.notes{
    min-height:65px;
    padding:10px;
    border:1px solid #D9DEE5;
    white-space:pre-wrap;
}

.signatures{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:70px;
    margin-top:55px;
    page-break-inside:avoid;
}

.signature{
    padding-top:8px;
    border-top:1px solid #697587;
    text-align:center;
    color:#526071;
}

.footer{
    margin-top:30px;
    padding-top:8px;
    border-top:1px solid #D9DEE5;
    color:#7A8593;
    font-size:8px;
    text-align:center;
}

.logo{
    width:170px;
    height:auto;
}

.qr{
    width:90px;
    height:90px;
}

.badge{
    display:inline-block;
    padding:4px 10px;
    border-radius:30px;
    background:#13233A;
    color:#fff;
    font-size:9px;
    font-weight:700;
    letter-spacing:.5px;
}

hr.separator{
    border:none;
    border-top:1px solid #D9DEE5;
    margin:20px 0;
}

@media print{

    body{
        print-color-adjust:exact;
        -webkit-print-color-adjust:exact;
    }

    .no-print{
        display:none!important;
    }

}
`;

export default getBaseStyles;
