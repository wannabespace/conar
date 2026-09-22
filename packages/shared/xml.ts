export const formatXml = (sourceXml: string) => {
  try {
    const xmlDoc = new DOMParser().parseFromString(sourceXml, 'application/xml')
    if (xmlDoc.querySelectorAll('parsererror').length > 0) {
      return sourceXml
    }
    const xsltDoc = new DOMParser().parseFromString(
      [
        '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
        '  <xsl:strip-space elements="*"/>',
        '  <xsl:template match="para[content-style][not(text())]">',
        '    <xsl:value-of select="normalize-space(.)"/>',
        '  </xsl:template>',
        '  <xsl:template match="node()|@*">',
        '    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
        '  </xsl:template>',
        '  <xsl:output indent="yes"/>',
        '</xsl:stylesheet>',
      ].join('\n'),
      'application/xml'
    )

    if (xsltDoc.querySelectorAll('parsererror').length > 0) {
      return sourceXml
    }

    const xsltProcessor = new XSLTProcessor()
    xsltProcessor.importStylesheet(xsltDoc)
    const resultDoc = xsltProcessor.transformToDocument(xmlDoc)
    const resultXml = new XMLSerializer().serializeToString(resultDoc)
    return resultXml
  } catch {
    return sourceXml
  }
}
