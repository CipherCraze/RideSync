import os

doc_dir = os.path.join(os.path.dirname(__file__), "..", "uploads", "documents")
os.makedirs(doc_dir, exist_ok=True)

def create_dummy_pdf(filepath, title):
    content = f"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length 55 >> stream
BT /F1 18 Tf 50 700 Td ({title} - RideSync Verified Document) ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000216 00000 n 
trailer << /Root 1 0 R /Size 5 >>
startxref
324
%%EOF"""
    with open(filepath, "wb") as f:
        f.write(content.encode("latin-1"))

create_dummy_pdf(os.path.join(doc_dir, "sample_rc.pdf"), "Registration Certificate (RC)")
create_dummy_pdf(os.path.join(doc_dir, "sample_puc.pdf"), "Pollution Under Control (PUC)")
create_dummy_pdf(os.path.join(doc_dir, "sample_service_record.pdf"), "Vehicle Periodic Service Log")
create_dummy_pdf(os.path.join(doc_dir, "sample_insurance.pdf"), "Comprehensive Motor Insurance")
print("Sample documents generated successfully!")
