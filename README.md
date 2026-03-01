# 健身计划打字机 (Gym Cards Typewriter)

这是一个基于 Web 的打字机风格健身计划生成器，它可以根据用户的身体数据和目标，通过 Google Gemini API 生成个性化的健身建议，并以复古打字机动画的形式展示，最终支持导出为 PNG 图片。

## 功能特点

*   **打字机风格界面**：复古字体、纸张质感、光标闪烁动画。
*   **智能生成**：接入 Google Gemini API，根据用户输入生成专业建议。
*   **个性化输入**：支持身高、体重、体型、经验、器械、目标等详细参数。
*   **动态展示**：逐字打印的生成过程，增强沉浸感。
*   **一键导出**：支持将生成的健身卡片导出为 PNG 图片，方便分享。
*   **本地配置**：API Key 仅保存在本地浏览器缓存中，安全无忧。

## 使用方法

1.  **获取 API Key**：
    *   访问 [Google AI Studio](https://aistudio.google.com/app/apikey) 获取免费的 Gemini API Key。
2.  **配置设置**：
    *   打开网页，点击右上角的 `⚙️ 设置`。
    *   粘贴您的 API Key 并保存。选择您偏好的 Gemini 模型。
3.  **生成计划**：
    *   填写左侧的个人信息表单。
    *   点击 `生成计划 [ENTER]`。
4.  **保存卡片**：
    *   等待打字机动画完成。
    *   点击 `导出 PNG` 保存您的专属健身卡片。

## 技术栈

*   HTML5
*   CSS3 (Flexbox, CSS Animations)
*   JavaScript (ES6+, Fetch API)
*   [html2canvas](https://html2canvas.hertzen.com/) (用于截图导出)
*   Google Gemini API

## 本地运行

直接在浏览器中打开 `index.html` 即可使用。无需复杂的构建步骤。
