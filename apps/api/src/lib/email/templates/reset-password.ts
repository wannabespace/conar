export function resetPasswordTemplate(name: string, url: string) {
  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <!--$-->
  </head>
  <body style="background-color:#f0f9ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Oxygen','Ubuntu','Cantarell','Fira Sans','Droid Sans','Helvetica Neue',sans-serif">
    <table
      border="0"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      align="center">
      <tbody>
        <tr>
          <td style="background-color:#f0f9ff;padding:20px 0">
            <div
              style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0"
              data-skip-in-text="true">
              Reset Your Conar Password
              <div>
                &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
              </div>
            </div>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="max-width:600px;background-color:#ffffff;border:1px solid #e0f2fe;border-radius:12px;padding:48px;margin:0 auto;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)">
              <tbody>
                <tr style="width:100%">
                  <td>
                    <!-- Logo Section -->
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="margin-bottom:8px">
                      <tbody>
                        <tr>
                          <td align="center">
                            <img
                              src="https://conar.app/app-logo.png"
                              alt="Conar"
                              width="48"
                              height="48"
                              style="display:block;outline:none;border:none;text-decoration:none;margin:0 auto 16px" />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <!-- Title Section -->
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="margin-bottom:32px">
                      <tbody>
                        <tr>
                          <td align="center">
                            <h1 style="color:#0c4a6e;font-size:28px;font-weight:700;line-height:36px;margin:0;margin-bottom:8px">
                              Reset Your Conar Password
                            </h1>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <!-- Content Section -->
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation">
                      <tbody>
                        <tr>
                          <td>
                            <p
                              style="font-size:16px;line-height:26px;color:#334155;margin:0;margin-bottom:16px">
                              Hi ${name},
                            </p>
                            <p
                              style="font-size:16px;line-height:26px;color:#334155;margin:0;margin-bottom:32px">
                              We received a request to reset your password for your Conar account. Click the button below to set a new password:
                            </p>
                            <!-- Button Section -->
                            <table
                              align="center"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="margin-bottom:32px">
                              <tbody>
                                <tr>
                                  <td align="center">
                                    <a
                                      href="${url}"
                                      style="line-height:100%;text-decoration:none;display:inline-block;max-width:100%;mso-padding-alt:0px;background-color:#4876EA;border-radius:8px;color:#ffffff;font-size:16px;font-weight:600;text-align:center;padding:14px 32px;box-shadow:0 2px 4px rgba(2,132,199,0.3)"
                                      target="_blank"
                                      ><span
                                        ><!--[if mso]><i style="mso-font-width:350%;mso-text-raise:18" hidden>&#8202;</i><![endif]--></span
                                      ><span
                                        style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:9px"
                                        >Reset Password</span
                                      ><span
                                        ><!--[if mso]><i style="mso-font-width:350%" hidden>&#8202;&#8203;</i><![endif]--></span
                                      ></a
                                    >
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <p
                              style="font-size:14px;line-height:24px;color:#64748b;margin:0;margin-bottom:12px;text-align:center">
                              Or copy and paste this link in your browser:
                            </p>
                            <p
                              style="font-size:12px;line-height:20px;color:#64748b;word-break:break-all;background-color:#f0f9ff;padding:14px;border-radius:8px;margin:0;margin-bottom:32px;font-family:monospace;border:1px solid #e0f2fe">
                              ${url}
                            </p>
                            <p
                              style="font-size:14px;line-height:24px;color:#64748b;margin:0;margin-bottom:12px">
                              If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                            </p>
                            <p
                              style="font-size:14px;line-height:24px;color:#64748b;margin:0;margin-bottom:16px">
                              This link will expire in <strong style="color:#0c4a6e">1 hour</strong> for security reasons.
                            </p>
                            <hr style="border:none;border-top:1px solid #e0f2fe;margin:32px 0" />
                            <p
                              style="font-size:12px;line-height:20px;color:#94a3b8;margin:0;text-align:center">
                              Best regards,<br />
                              <strong style="color:#4876EA">The Conar Team</strong>
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
    <!--/$-->
  </body>
</html>
    `
}
