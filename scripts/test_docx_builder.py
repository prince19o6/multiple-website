import zipfile
import html
import os
import xml.sax.saxutils

def escape(text):
    return xml.sax.saxutils.escape(str(text))

class DocxBuilder:
    def __init__(self):
        self.body_elements = []

    def add_title(self, text, subtitle=None):
        xml_frag = f'''<w:p>
            <w:pPr>
                <w:pStyle w:val="Title"/>
                <w:jc w:val="center"/>
                <w:spacing w:before="360" w:after="120"/>
            </w:pPr>
            <w:r>
                <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                    <w:b/>
                    <w:sz w:val="52"/>
                    <w:color w:val="0D9488"/>
                </w:rPr>
                <w:t>{escape(text)}</w:t>
            </w:r>
        </w:p>'''
        self.body_elements.append(xml_frag)

        if subtitle:
            sub_frag = f'''<w:p>
                <w:pPr>
                    <w:jc w:val="center"/>
                    <w:spacing w:before="0" w:after="360"/>
                </w:pPr>
                <w:r>
                    <w:rPr>
                        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                        <w:i/>
                        <w:sz w:val="24"/>
                        <w:color w:val="64748B"/>
                    </w:rPr>
                    <w:t>{escape(subtitle)}</w:t>
                </w:r>
            </w:p>'''
            self.body_elements.append(sub_frag)

    def add_heading_1(self, text):
        xml_frag = f'''<w:p>
            <w:pPr>
                <w:spacing w:before="400" w:after="160"/>
                <w:pBdr>
                    <w:bottom w:val="single" w:sz="12" w:space="4" w:color="0D9488"/>
                </w:pBdr>
            </w:pPr>
            <w:r>
                <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                    <w:b/>
                    <w:sz w:val="36"/>
                    <w:color w:val="0F172A"/>
                </w:rPr>
                <w:t>{escape(text)}</w:t>
            </w:r>
        </w:p>'''
        self.body_elements.append(xml_frag)

    def add_heading_2(self, text):
        xml_frag = f'''<w:p>
            <w:pPr>
                <w:spacing w:before="280" w:after="120"/>
            </w:pPr>
            <w:r>
                <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                    <w:b/>
                    <w:sz w:val="28"/>
                    <w:color w:val="0D9488"/>
                </w:rPr>
                <w:t>{escape(text)}</w:t>
            </w:r>
        </w:p>'''
        self.body_elements.append(xml_frag)

    def add_heading_3(self, text):
        xml_frag = f'''<w:p>
            <w:pPr>
                <w:spacing w:before="200" w:after="80"/>
            </w:pPr>
            <w:r>
                <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                    <w:b/>
                    <w:sz w:val="24"/>
                    <w:color w:val="334155"/>
                </w:rPr>
                <w:t>{escape(text)}</w:t>
            </w:r>
        </w:p>'''
        self.body_elements.append(xml_frag)

    def add_paragraph(self, text, bold_prefix=None):
        xml_runs = []
        if bold_prefix:
            xml_runs.append(f'''<w:r>
                <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                    <w:b/>
                    <w:color w:val="0F172A"/>
                </w:rPr>
                <w:t xml:space="preserve">{escape(bold_prefix)} </w:t>
            </w:r>''')
        xml_runs.append(f'''<w:r>
            <w:rPr>
                <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                <w:sz w:val="22"/>
                <w:color w:val="334155"/>
            </w:rPr>
            <w:t>{escape(text)}</w:t>
        </w:r>''')

        xml_frag = f'''<w:p>
            <w:pPr>
                <w:spacing w:before="60" w:after="120" w:line="276" w:lineRule="auto"/>
            </w:pPr>
            {''.join(xml_runs)}
        </w:p>'''
        self.body_elements.append(xml_frag)

    def add_bullet(self, text, bold_prefix=None):
        xml_runs = []
        xml_runs.append('''<w:r>
            <w:rPr>
                <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                <w:b/>
                <w:color w:val="0D9488"/>
            </w:rPr>
            <w:t xml:space="preserve">  •  </w:t>
        </w:r>''')
        if bold_prefix:
            xml_runs.append(f'''<w:r>
                <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                    <w:b/>
                    <w:sz w:val="22"/>
                    <w:color w:val="0F172A"/>
                </w:rPr>
                <w:t xml:space="preserve">{escape(bold_prefix)}: </w:t>
            </w:r>''')
        xml_runs.append(f'''<w:r>
            <w:rPr>
                <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                <w:sz w:val="22"/>
                <w:color w:val="334155"/>
            </w:rPr>
            <w:t>{escape(text)}</w:t>
        </w:r>''')

        xml_frag = f'''<w:p>
            <w:pPr>
                <w:ind w:left="400"/>
                <w:spacing w:before="40" w:after="60"/>
            </w:pPr>
            {''.join(xml_runs)}
        </w:p>'''
        self.body_elements.append(xml_frag)

    def add_callout(self, title, text, box_type="info"):
        border_color = "0D9488" if box_type == "info" else "F59E0B"
        bg_color = "F0FDFA" if box_type == "info" else "FFFBEB"

        xml_frag = f'''<w:tbl>
            <w:tblPr>
                <w:tblW w:w="9360" w:type="dxa"/>
                <w:tblBorders>
                    <w:top w:val="none"/>
                    <w:left w:val="single" w:sz="36" w:space="0" w:color="{border_color}"/>
                    <w:bottom w:val="none"/>
                    <w:right w:val="none"/>
                </w:tblBorders>
                <w:tblCellMar>
                    <w:top w:w="140" w:type="dxa"/>
                    <w:left w:w="240" w:type="dxa"/>
                    <w:bottom w:w="140" w:type="dxa"/>
                    <w:right w:w="200" w:type="dxa"/>
                </w:tblCellMar>
            </w:tblPr>
            <w:tr>
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="9360" w:type="dxa"/>
                        <w:shd w:val="clear" w:color="auto" w:fill="{bg_color}"/>
                    </w:tcPr>
                    <w:p>
                        <w:pPr><w:spacing w:before="40" w:after="60"/></w:pPr>
                        <w:r>
                            <w:rPr>
                                <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                                <w:b/>
                                <w:sz w:val="22"/>
                                <w:color w:val="{border_color}"/>
                            </w:rPr>
                            <w:t>{escape(title)}</w:t>
                        </w:r>
                    </w:p>
                    <w:p>
                        <w:pPr><w:spacing w:before="40" w:after="60"/></w:pPr>
                        <w:r>
                            <w:rPr>
                                <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                                <w:sz w:val="21"/>
                                <w:color w:val="334155"/>
                            </w:rPr>
                            <w:t>{escape(text)}</w:t>
                        </w:r>
                    </w:p>
                </w:tc>
            </w:tr>
        </w:tbl>
        <w:p><w:pPr><w:spacing w:before="120" w:after="120"/></w:pPr></w:p>'''
        self.body_elements.append(xml_frag)

    def add_table(self, headers, rows):
        total_width = 9360
        col_count = len(headers)
        col_width = total_width // col_count

        tbl_xml = [f'''<w:tbl>
            <w:tblPr>
                <w:tblW w:w="{total_width}" w:type="dxa"/>
                <w:tblBorders>
                    <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
                    <w:left w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
                    <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
                    <w:right w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
                    <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
                    <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
                </w:tblBorders>
                <w:tblCellMar>
                    <w:top w:w="120" w:type="dxa"/>
                    <w:left w:w="140" w:type="dxa"/>
                    <w:bottom w:w="120" w:type="dxa"/>
                    <w:right w:w="140" w:type="dxa"/>
                </w:tblCellMar>
            </w:tblPr>''']

        # Header Row
        header_xml = ['<w:tr><w:trPr><w:tblHeader/></w:trPr>']
        for h in headers:
            header_xml.append(f'''<w:tc>
                <w:tcPr>
                    <w:tcW w:w="{col_width}" w:type="dxa"/>
                    <w:shd w:val="clear" w:color="auto" w:fill="0D9488"/>
                </w:tcPr>
                <w:p>
                    <w:pPr><w:spacing w:before="60" w:after="60"/></w:pPr>
                    <w:r>
                        <w:rPr>
                            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                            <w:b/>
                            <w:sz w:val="21"/>
                            <w:color w:val="FFFFFF"/>
                        </w:rPr>
                        <w:t>{escape(h)}</w:t>
                    </w:r>
                </w:p>
            </w:tc>''')
        header_xml.append('</w:tr>')
        tbl_xml.append(''.join(header_xml))

        # Data Rows
        for r_idx, row in enumerate(rows):
            row_bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
            r_xml = ['<w:tr>']
            for c_idx, cell in enumerate(row):
                r_xml.append(f'''<w:tc>
                    <w:tcPr>
                        <w:tcW w:w="{col_width}" w:type="dxa"/>
                        <w:shd w:val="clear" w:color="auto" w:fill="{row_bg}"/>
                    </w:tcPr>
                    <w:p>
                        <w:pPr><w:spacing w:before="60" w:after="60"/></w:pPr>
                        <w:r>
                            <w:rPr>
                                <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                                <w:sz w:val="20"/>
                                <w:color w:val="334155"/>
                            </w:rPr>
                            <w:t>{escape(str(cell))}</w:t>
                        </w:r>
                    </w:p>
                </w:tc>''')
            r_xml.append('</w:tr>')
            tbl_xml.append(''.join(r_xml))

        tbl_xml.append('</w:tbl>')
        tbl_xml.append('<w:p><w:pPr><w:spacing w:before="120" w:after="160"/></w:pPr></w:p>')
        self.body_elements.append(''.join(tbl_xml))

    def add_page_break(self):
        self.body_elements.append('<w:p><w:r><w:br w:type="page"/></w:r></w:p>')

    def build(self, output_path):
        content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>'''

        package_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'''

        doc_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>'''

        settings = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:zoom w:percent="100"/>
</w:settings>'''

        styles = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:color w:val="334155"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="120" w:line="240" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
</w:styles>'''

        body_inner = "".join(self.body_elements)
        document_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {body_inner}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>'''

        with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr("[Content_Types].xml", content_types)
            z.writestr("_rels/.rels", package_rels)
            z.writestr("word/_rels/document.xml.rels", doc_rels)
            z.writestr("word/styles.xml", styles)
            z.writestr("word/settings.xml", settings)
            z.writestr("word/document.xml", document_xml)

        print(f"Generated successfully: {output_path}")

if __name__ == "__main__":
    builder = DocxBuilder()
    builder.add_title("Test Document", "System Verification")
    builder.add_heading_1("1. Overview")
    builder.add_paragraph("This is a test paragraph to verify docx generation without external dependencies.")
    builder.build("test_output.docx")

