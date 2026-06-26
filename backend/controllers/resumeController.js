const puppeteer = require("puppeteer");
const User = require("../models/User");
const { asyncHandler, ApiError } = require("../utils/apiResponse");

const generateResumeHTML = (user) => {
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "Present";

  const experienceHTML = user.experience?.length
    ? user.experience.map((e) => `
      <div class="entry">
        <div class="entry-header">
          <div>
            <div class="entry-title">${e.title}</div>
            <div class="entry-subtitle">${e.company}</div>
          </div>
          <div class="entry-date">${formatDate(e.startDate)} – ${e.current ? "Present" : formatDate(e.endDate)}</div>
        </div>
        ${e.description ? `<p class="entry-desc">${e.description}</p>` : ""}
      </div>`).join("")
    : "<p class='empty'>No experience added yet</p>";

  const educationHTML = user.education?.length
    ? user.education.map((e) => `
      <div class="entry">
        <div class="entry-header">
          <div>
            <div class="entry-title">${e.school}</div>
            <div class="entry-subtitle">${e.degree}${e.field ? ` · ${e.field}` : ""}</div>
          </div>
          <div class="entry-date">${e.startYear || ""} – ${e.endYear || "Present"}</div>
        </div>
      </div>`).join("")
    : "<p class='empty'>No education added yet</p>";

  const skillsHTML = user.skills?.length
    ? user.skills.map((s) => `<span class="skill">${s}</span>`).join("")
    : "<p class='empty'>No skills added yet</p>";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: "Segoe UI", Arial, sans-serif; font-size:13px; color:#1a1a1a; background:#fff; padding:40px 48px; line-height:1.5; }
  .header { border-bottom:3px solid #2563eb; padding-bottom:18px; margin-bottom:24px; display:flex; align-items:flex-start; gap:20px; }
  .avatar { width:72px; height:72px; border-radius:50%; object-fit:cover; flex-shrink:0; }
  .avatar-placeholder { width:72px; height:72px; border-radius:50%; background:#dbeafe; display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:700; color:#2563eb; flex-shrink:0; }
  .header-info { flex:1; }
  .name { font-size:26px; font-weight:700; color:#1e3a8a; }
  .headline { font-size:14px; color:#2563eb; margin-top:3px; font-weight:500; }
  .meta { display:flex; flex-wrap:wrap; gap:12px; margin-top:8px; font-size:12px; color:#555; }
  .meta span::before { content:"📍 "; }
  .meta a::before { content:"🔗 "; }
  .meta a { color:#2563eb; text-decoration:none; }
  h2 { font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#2563eb; margin:20px 0 10px; border-bottom:1px solid #e5e7eb; padding-bottom:4px; }
  .bio { font-size:13px; color:#374151; line-height:1.6; }
  .entry { margin-bottom:14px; }
  .entry-header { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; }
  .entry-title { font-weight:600; font-size:13px; }
  .entry-subtitle { font-size:12px; color:#6b7280; margin-top:1px; }
  .entry-date { font-size:11px; color:#9ca3af; white-space:nowrap; flex-shrink:0; }
  .entry-desc { font-size:12px; color:#4b5563; margin-top:6px; }
  .skills { display:flex; flex-wrap:wrap; gap:6px; }
  .skill { background:#eff6ff; color:#1d4ed8; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:500; }
  .empty { color:#9ca3af; font-size:12px; font-style:italic; }
  .footer { margin-top:32px; padding-top:12px; border-top:1px solid #e5e7eb; text-align:center; font-size:10px; color:#9ca3af; }
</style>
</head>
<body>
  <div class="header">
    ${user.avatar
      ? `<img class="avatar" src="${user.avatar}" alt="${user.name}"/>`
      : `<div class="avatar-placeholder">${user.name.charAt(0).toUpperCase()}</div>`}
    <div class="header-info">
      <div class="name">${user.name}</div>
      ${user.headline ? `<div class="headline">${user.headline}</div>` : ""}
      <div class="meta">
        ${user.location ? `<span>${user.location}</span>` : ""}
        ${user.email ? `<span style="--content:'✉ '">${user.email}</span>` : ""}
        ${user.website ? `<a href="${user.website}">${user.website}</a>` : ""}
      </div>
    </div>
  </div>

  ${user.bio ? `<h2>About</h2><p class="bio">${user.bio}</p>` : ""}

  <h2>Experience</h2>
  ${experienceHTML}

  <h2>Education</h2>
  ${educationHTML}

  <h2>Skills</h2>
  <div class="skills">${skillsHTML}</div>

  <div class="footer">Generated from ConnectSphere · ${new Date().toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}</div>
</body>
</html>`;
};

// GET /api/users/:username/resume — download PDF resume
const downloadResume = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username })
    .select("-password -refreshToken");

  if (!user) throw new ApiError(404, "User not found");

  const html = generateResumeHTML(user);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${user.username}-resume.pdf"`,
      "Content-Length": pdf.length,
    });

    res.send(pdf);
  } finally {
    await browser.close();
  }
});

module.exports = { downloadResume };
