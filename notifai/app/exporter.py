import markdown
from xhtml2pdf import pisa


def export_document(text: str, format: str, filename: str):
    if format == "md":
        with open(f"{filename}.md", "w") as f:
            f.write(text)
    elif format == "txt":
        with open(f"{filename}.txt", "w") as f:
            f.write(text)
    elif format == "html":
        html_content = markdown.markdown(text, extensions=["tables", "fenced_code"])
        with open(f"{filename}.html", "w") as f:
            f.write(html_content)
    elif format == "pdf":
        html_content = markdown.markdown(text, extensions=["tables", "fenced_code"])
        html_doc = f"""
        <html>
        <head><meta charset="utf-8"><style>body {{ font-family: sans-serif; line-height: 1.6; }}</style></head>
        <body>{html_content}</body>
        </html>
        """
        with open(f"{filename}.pdf", "w+b") as result_file:
            pisa.CreatePDF(html_doc, dest=result_file)
