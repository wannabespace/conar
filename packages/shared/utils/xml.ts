// https://stackoverflow.com/a/47317538/25689393
export function formatXml(sourceXml: string) {
  try {
    const xmlDoc = new DOMParser().parseFromString(sourceXml, 'application/xml')
    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
      return sourceXml
    }
    const xsltDoc = new DOMParser().parseFromString([
      // describes how we want to modify the XML - indent everything
      '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:strip-space elements="*"/>',
      '  <xsl:template match="para[content-style][not(text())]">', // change to just text() to strip space in text nodes
      '    <xsl:value-of select="normalize-space(.)"/>',
      '  </xsl:template>',
      '  <xsl:template match="node()|@*">',
      '    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
      '  </xsl:template>',
      '  <xsl:output indent="yes"/>',
      '</xsl:stylesheet>',
    ].join('\n'), 'application/xml')

    if (xsltDoc.getElementsByTagName('parsererror').length > 0) {
      return sourceXml
    }

    const xsltProcessor = new XSLTProcessor()
    xsltProcessor.importStylesheet(xsltDoc)
    const resultDoc = xsltProcessor.transformToDocument(xmlDoc)
    const resultXml = new XMLSerializer().serializeToString(resultDoc)
    return resultXml
  }
  catch {
    return sourceXml
  }
}
