# KREIS e-Office — ಫೈಲ್ ನಕ್ಷೆ (File Map)

ಸೈಟ್: https://mdrsshedbarieoffice.in  |  GitHub Pages ನಲ್ಲಿ ನಡೆಯುತ್ತದೆ.

ಮೊದಲು ಎಲ್ಲಾ ಕೋಡ್ ಒಂದೇ `index.html` ನಲ್ಲಿತ್ತು (ಸುಮಾರು 20,000 ಸಾಲು). ಈಗ ಪುಟ/ಪಾತ್ರದ ಪ್ರಕಾರ ಬೇರೆ ಬೇರೆ ಫೈಲ್‌ಗಳಲ್ಲಿದೆ, ಹಾಗಾಗಿ ಒಂದು ಪುಟವನ್ನು ಬದಲಿಸಲು ಅದರ ಫೈಲ್ ಮಾತ್ರ ತೆರೆದರೆ ಸಾಕು.

## ಫೈಲ್‌ಗಳು

| ಫೈಲ್ | ಏನಿದೆ | ಮುಖ್ಯ render ಫಂಕ್ಷನ್‌ಗಳು |
|---|---|---|
| `index.html` | ಪುಟದ ಚೌಕಟ್ಟು (ಮೆನು, ಲಾಗಿನ್ ಬಾಕ್ಸ್ ಇತ್ಯಾದಿ HTML) ಮತ್ತು ಫೈಲ್‌ಗಳ ಲೋಡ್ ಪಟ್ಟಿ | — |
| `css/app.css` | ಎಲ್ಲಾ ಬಣ್ಣ, ಅಕ್ಷರ, ವಿನ್ಯಾಸ (CSS) | — |
| `js/assets.js` | ಚಿತ್ರಗಳು (ಶಾಲೆ ಫೋಟೋ, ಲೋಗೋ, ಸಹಿ) — base64 ರೂಪದಲ್ಲಿ. ಸಾಮಾನ್ಯವಾಗಿ ಮುಟ್ಟಬೇಡಿ | — |
| `js/core.js` | ಕೋರ್: ಡೇಟಾಬೇಸ್, ಸರ್ವರ್ ಸಿಂಕ್ (Cloudflare), ಲಾಗಿನ್ ತರ್ಕ, ಪುಟ ಬದಲಾವಣೆ (navigate), ಮೆನು | `renderWelcome`, `renderNotifBadge`, `renderPwReset`, `renderSidebar` |
| `js/common.js` | ಸಾಮಾನ್ಯ ಸಹಾಯಕ ಫಂಕ್ಷನ್‌ಗಳು (ಹಣ ಫಾರ್ಮ್ಯಾಟ್, ಫಾರ್ಮ್ ಕ್ಷೇತ್ರಗಳು) | — |
| `js/students-staff.js` | ವಿದ್ಯಾರ್ಥಿ ನೋಂದಣಿ, ಹೊಸ ಪ್ರವೇಶ, ವಿದ್ಯಾರ್ಥಿ ಪಟ್ಟಿ Excel, ಸಿಬ್ಬಂದಿ ಚಲನಾವಲನ ವಹಿ | `renderStudents`, `renderMovement`, `renderBulkPreview`, `renderStudentExport` |
| `js/stock-assets.js` | ಸಾಮಗ್ರಿ ಸ್ಟಾಕ್, ಆಸ್ತಿ ರಿಜಿಸ್ಟರ್, ವಿತರಣೆ | `renderAssetsRegister`, `renderStockHub`, `renderStockTabBody`, `renderGenRegister` |
| `js/finance.js` | ಹಣಕಾಸು: ಬಿಲ್ ಪಾವತಿ (DC Bill), ನಗದು ಪುಸ್ತಕ, ಬ್ಯಾಂಕ್ ಹೊಂದಾಣಿಕೆ, ಬಜೆಟ್, ಮಾಸಿಕ ಖರ್ಚು | `renderBills`, `renderCashbook`, `renderBudget`, `renderMonthExp` |
| `js/correspondence.js` | ಪತ್ರ ವ್ಯವಹಾರ: ಒಳಬರುವ/ಹೊರಹೋಗುವ ಪತ್ರಗಳ ವಹಿ, ಸ್ವೀಕೃತಿ ವಹಿ, ಆಂತರಿಕ ಸಂದೇಶ ಪೆಟ್ಟಿಗೆ | `renderGenericModule`, `renderAck`, `renderLetterhead`, `renderInward` |
| `js/teacher.js` | ಶಿಕ್ಷಕರ ಲಾಗಿನ್ ಪುಟಗಳು (ಡ್ಯಾಶ್‌ಬೋರ್ಡ್, ತರಗತಿ ಶಿಕ್ಷಕರ ಕೆಲಸ ಇತ್ಯಾದಿ — ಕೆಳಗಿನ ಫಂಕ್ಷನ್ ಹೆಸರುಗಳಿಂದ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ) | `renderProfile`, `renderStaffDetails`, `renderTeacherMessages`, `renderTmsgList` |
| `js/consolidate.js` | ಫಲಿತಾಂಶ ಕ್ರೋಡೀಕರಣ (Consolidation) | `renderConsolidatedPage` |
| `js/attendance-salary.js` | ಹಾಜರಾತಿ, ಸಂಬಳ, ಪ್ರಶ್ನೆ ಪತ್ರಿಕೆ ಅಪ್‌ಲೋಡ್ | `renderQPUpload`, `renderQPDashboard`, `renderQPFDA`, `renderTABill` |
| `js/administration.js` | ಆಡಳಿತ: ಕರ್ತವ್ಯ ನಿಯೋಜನೆ ಆದೇಶ, ಪತ್ರಲೇಖನ / ಕಚೇರಿ ಆದೇಶ | `renderDutyAllot`, `renderNoticeBoard`, `renderStaffDocFiles`, `renderMOD` |
| `js/documents.js` | ದಾಖಲೆ/ಪ್ರಮಾಣಪತ್ರಗಳು: ಅಂಕ ಪತ್ರ, ಅಧ್ಯಯನ ಪ್ರಮಾಣಪತ್ರ, TC, ಪ್ರೋಗ್ರೆಸ್ ಕಾರ್ಡ್ | `renderMarksCard`, `renderPCSign`, `renderDocIssue`, `renderSCTC` |
| `js/warden.js` | ವಾರ್ಡನ್ ಲಾಗಿನ್ ಪುಟಗಳು (ಆಹಾರ, ಹಾಸ್ಟೆಲ್) | `renderFoodDash`, `renderFoodIssue`, `renderFoodMonthly`, `renderHostelItems` |
| `js/meetings.js` | ಸಿಬ್ಬಂದಿ ಸಭೆ / ಪಾಲಕರ ಸಭೆ ರಿಜಿಸ್ಟರ್ ಮತ್ತು ಮುದ್ರಣ | `renderMeetingReg`, `renderMtgSign` |
| `js/fda.js` | FDA ಲಾಗಿನ್: ಡ್ಯಾಶ್‌ಬೋರ್ಡ್, ವೆಬ್‌ಸೈಟ್ ಪುಟ ನಿರ್ವಹಣೆ, ಫೈಲ್ ಅಪ್‌ಲೋಡ್ (Uploads) | `renderSiteContent`, `renderFDAUploads`, `renderELUpdate`, `renderDscRegister` |
| `js/staff-inbox.js` | ಸಿಬ್ಬಂದಿ/ವಾರ್ಡನ್/FDA ಡ್ಯಾಶ್‌ಬೋರ್ಡ್: ಸಹಿ/ಕ್ರಮಕ್ಕೆ ಬಾಕಿ ಇರುವ ಸಂದೇಶಗಳ ಪಟ್ಟಿ | `staffPendingItems`, `staffInboxHTML` |
| `js/principal.js` | ಪ್ರಾಂಶುಪಾಲರ ಲಾಗಿನ್: ಡ್ಯಾಶ್‌ಬೋರ್ಡ್, ಬಾಕಿ ಅನುಮೋದನೆ, E-Sign | `renderExamActivation`, `renderClassAlloc`, `renderSCTCSign`, `renderWardenCharge` |
| `js/home.js` | ಮುಖಪುಟ (Home) ಮತ್ತು ಸ್ಟಾಫ್ ಲಾಗಿನ್ ಪುಟ, ಸೇವೆಗಳು ಪಟ್ಟಿ, ಸಂಪರ್ಕ ಪೆಟ್ಟಿಗೆ, ದಾಖಲೆ ಪರಿಶೀಲನೆ | — |
| `js/training-cert.js` | ತರಬೇತಿ ನೋಂದಣಿ ಮತ್ತು ಹಾಜರಾತಿ ಪ್ರಮಾಣಪತ್ರ (ನೋಂದಣಿ ಪಟ್ಟಿ, Generate, ವಿತರಣಾ ವಹಿ, ಮರುಸ್ಥಾಪನೆ) | `renderAttCert` |
| `js/training-materials.js` | ತರಬೇತಿ ಸಾಮಗ್ರಿ ಸ್ವೀಕೃತಿ ವಹಿ, ಅಂಕ ಪರಿಶೀಲನೆ (Marks Verify) ಮತ್ತು ಮುಖಪುಟದ ಉಳಿದ ಭಾಗಗಳು | `renderMarksVerification` |
| `js/certimport.js` | ಪ್ರಮಾಣಪತ್ರ ಆಮದು (Excel ನಿಂದ) | `renderCertImport` |
| `js/other.js` | ಇತರೆ: ಬೀಡಿಗ ಅನುಮೋದನೆ ಮುಂತಾದ ಬಾಕಿ ಸಣ್ಣ ಭಾಗಗಳು, ತಿರಸ್ಕಾರ ಕಾರ್ಡ್, ಒಳಬರುವ ಪತ್ರ ಕಾನ್ಫಿಗ್ | `renderPrincipalBeedigaApproval`, `renderPrincipalIndentApprovals`, `renderMyDuties`, `renderWhatsAppPanel` |
| `js/main.js` | ಆ್ಯಪ್ ಪ್ರಾರಂಭ — ಎಲ್ಲಾ ಫೈಲ್ ಲೋಡ್ ಆಗಿವೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ init() ಚಲಾಯಿಸುತ್ತದೆ. ಹೊಸ ಫೈಲ್ ಸೇರಿಸಿದರೆ ಇಲ್ಲಿನ need ಪಟ್ಟಿಗೂ ಸೇರಿಸಿ | — |

## ಬದಲಾವಣೆ ಮಾಡುವ ವಿಧಾನ

1. ಯಾವ ಪುಟ ಬದಲಿಸಬೇಕೋ ಅದರ ಫೈಲ್ ಮೇಲಿನ ಪಟ್ಟಿಯಿಂದ ಆರಿಸಿ. ಗೊತ್ತಿಲ್ಲದಿದ್ದರೆ GitHub ನಲ್ಲಿ ಹುಡುಕಾಟ (ಮೇಲಿನ `/` ಒತ್ತಿ) ಬಳಸಿ ಪುಟದ ಕನ್ನಡ ಹೆಸರು ಹುಡುಕಿ.
2. ಆ ಫೈಲ್ ಅನ್ನು GitHub ನಲ್ಲಿ ತೆರೆದು ಪೆನ್ಸಿಲ್ (Edit) ಐಕಾನ್ ಒತ್ತಿ ಬದಲಿಸಿ, "Commit changes" ಒತ್ತಿ.
3. **ಮುಖ್ಯ:** `index.html` ನಲ್ಲಿ `?v=` ನಂತರದ ಸಂಖ್ಯೆಯನ್ನು ಎಲ್ಲಾ ಸಾಲುಗಳಲ್ಲಿ ಬದಲಿಸಿ (ಉದಾ: `20261123a` → `20261123b`). ಹಾಗೆ ಮಾಡದಿದ್ದರೆ ಕೆಲವರ ಬ್ರೌಸರ್ ಹಳೆಯ ಫೈಲ್ ತೋರಿಸಬಹುದು. (`bump_version.sh` ಇದನ್ನು ಒಂದೇ ಬಾರಿ ಮಾಡುತ್ತದೆ.)
4. 1–2 ನಿಮಿಷ ಬಿಟ್ಟು ಸೈಟ್‌ನಲ್ಲಿ Ctrl+Shift+R ಒತ್ತಿ ಪರೀಕ್ಷಿಸಿ.

## ಎಚ್ಚರಿಕೆಗಳು
- ಫೈಲ್‌ಗಳು `index.html` ನಲ್ಲಿರುವ ಕ್ರಮದಲ್ಲೇ ಲೋಡ್ ಆಗುತ್ತವೆ. ಕ್ರಮ ಬದಲಿಸಬೇಡಿ.
- ಹೊಸ ಫೈಲ್ ಸೇರಿಸಿದರೆ: ಆ ಫೈಲ್‌ನ ಕೊನೆಯಲ್ಲಿ `;(window.__LOADED=window.__LOADED||[]).push('ಹೆಸರು');` ಸೇರಿಸಿ, `index.html` ನಲ್ಲಿ `<script>` ಸಾಲು ಸೇರಿಸಿ, ಮತ್ತು `js/main.js` ನ `need` ಪಟ್ಟಿಗೆ ಅದೇ ಹೆಸರು ಸೇರಿಸಿ.
- ಬದಲಾವಣೆಯ ನಂತರ ಒಂದು ಫೈಲ್‌ನಲ್ಲಿ ತಪ್ಪು ಇದ್ದರೆ ಸೈಟ್ "ಕೆಲವು ಫೈಲ್‌ಗಳು ಲೋಡ್ ಆಗಿಲ್ಲ (ಹೆಸರು)" ಎಂದು ಹೇಳುತ್ತದೆ. ಆ ಹೆಸರಿನ ಫೈಲ್ ನೋಡಿ.
- ಹಳೆಯ ಬ್ಯಾಕಪ್ ಫೈಲ್‌ಗಳು (`index. html`, `index.html.html`, `index_single_file_v39.html`) ಈಗ ಬಳಕೆಯಲ್ಲಿಲ್ಲ. ಬೇಕಾದರೆ ಅಳಿಸಬಹುದು.
