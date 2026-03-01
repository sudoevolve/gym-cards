import { GoogleGenAI } from "https://esm.run/@google/genai";
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const form = document.getElementById('gym-form');
    const settingsToggle = document.querySelector('.settings-toggle');
    const settingsModal = document.getElementById('settings-modal');
    const closeModal = document.querySelector('.close-modal');
    const saveSettingsBtn = document.getElementById('save-settings');
    const apiKeyInput = document.getElementById('api-key');
    const apiStyleSelect = document.getElementById('api-style');
    const apiModelSelect = document.getElementById('api-model');
    const customModelInput = document.getElementById('custom-model-input');
    const outputSection = document.getElementById('typewriter-output');
    const outputTextEl = document.getElementById('output-text');
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const copyBtn = document.getElementById('copy-btn');
    const topBtn = document.getElementById('top-btn');
    const clearBtn = document.getElementById('clear-btn');
    const outputActions = document.getElementById('output-actions');
    const currentDateSpan = document.getElementById('current-date');

    // State
    let apiKey = localStorage.getItem('gemini_api_key') || '';
    let apiStyle = localStorage.getItem('gemini_api_style') || 'typewriter';
    let apiModel = localStorage.getItem('gemini_api_model') || 'gemini-2.5-flash';
    let isTyping = false;
    let typingInterval;
    let requestInFlight = false;
    let lastRequestAt = 0;
    let lastOutputText = '';

    const promptTemplate = `
你是一名专业的自然健身增肌教练，请基于以下信息为我制定一套完整、可执行的增肌方案。

【个人信息】
- 身高：
- 体重：
- 性别：
- 训练经验（例如：可做多少个俯卧撑/引体）：
- 体型描述（偏瘦 / 正常 / 偏胖）：
- 目标（例如：胸肌变厚、腹肌更饱满、整体增肌）：
- 是否有器械（例如：无器械 / 只有瑜伽垫 / 有哑铃）：

【我希望方案包含以下内容】

1️⃣ 体型分析
- 当前BMI分析
- 增肌阶段目标体重建议
- 每周合理增重区间
- 预估周期

2️⃣ 热量与营养计算
- 估算每日维持热量
- 增肌所需热量区间
- 每日蛋白质目标（按体重计算）
- 碳水与脂肪建议比例
- 如果体重不增长应如何调整

3️⃣ 每日固定训练计划（方便记忆）
- 仅使用现有器械
- 适合自然增肌
- 明确组数、次数、节奏（例如3秒下放）
- 强调机械张力与接近力竭原则
- 包含进阶方式（每2周如何提升）

4️⃣ 三餐饮食结构
- 早餐 / 午餐 / 晚餐详细示例
- 每餐大概蛋白质估算
- 是否需要加餐
- 如果胃口小如何补充
- 是否建议蛋白粉

5️⃣ 执行原则
- 睡眠要求
- 如何判断是否吃够
- 如何判断是否训练强度足够
- 常见瘦人增肌误区

6️⃣ 输出格式要求
- 用清晰分段结构
- 用可直接执行的具体数字
- 不要泛泛而谈
- 不要给模糊建议
- 偏向自然健身现实可执行方案

请基于科学增肌原则，而不是极端健身方式。
`.trim();

    // Initialization
    if (apiKey) {
        apiKeyInput.value = apiKey;
    }
    if (apiStyle) {
        apiStyleSelect.value = apiStyle;
        document.body.setAttribute('data-style', apiStyle);
    }
    if (apiModel) {
        // Check if the saved model is in the dropdown list
        const optionExists = Array.from(apiModelSelect.options).some(option => option.value === apiModel);
        if (optionExists) {
            apiModelSelect.value = apiModel;
        } else {
            apiModelSelect.value = 'custom';
            customModelInput.value = apiModel;
            customModelInput.classList.remove('hidden');
        }
    }
    
    const now = new Date();
    currentDateSpan.textContent = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.');

    // Event Listeners
    apiModelSelect.addEventListener('change', () => {
        if (apiModelSelect.value === 'custom') {
            customModelInput.classList.remove('hidden');
        } else {
            customModelInput.classList.add('hidden');
        }
    });

    settingsToggle.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });

    closeModal.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('hidden');
        }
    });

    saveSettingsBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        const style = apiStyleSelect.value;
        let model = apiModelSelect.value;
        
        if (model === 'custom') {
            model = customModelInput.value.trim();
        }

        if (key) {
            apiKey = key;
            if (model) {
                apiModel = model;
                localStorage.setItem('gemini_api_model', apiModel);
            }
            if (style) {
                apiStyle = style;
                localStorage.setItem('gemini_api_style', apiStyle);
                document.body.setAttribute('data-style', apiStyle);
            }
            localStorage.setItem('gemini_api_key', apiKey);
            alert(`设置已保存！\n当前模型: ${apiModel}\n当前风格: ${apiStyle}`);
            settingsModal.classList.add('hidden');
        } else {
            alert('请输入有效的 API Key');
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!apiKey) {
            alert('请先在设置中配置 Google Gemini API Key');
            settingsModal.classList.remove('hidden');
            return;
        }

        if (isTyping) {
            clearInterval(typingInterval);
            isTyping = false;
        }

        const formData = {
            gender: document.getElementById('gender').value,
            height: document.getElementById('height').value,
            weight: document.getElementById('weight').value,
            bodyType: document.getElementById('body-type').value,
            experience: document.getElementById('experience').value,
            equipment: document.getElementById('equipment').value,
            goal: document.getElementById('goal').value
        };

        generatePlan(formData);
    });

    downloadBtn.addEventListener('click', () => {
        const element = document.getElementById('card-preview');
        const outputContent = document.getElementById('typewriter-output');
        
        // Temporarily expand content to full height for capture
        const originalMaxHeight = outputContent.style.maxHeight;
        const originalOverflow = outputContent.style.overflow;
        
        outputContent.style.maxHeight = 'none';
        outputContent.style.overflow = 'visible';

        // Temporarily remove shadow and margin for cleaner export
        const originalBoxShadow = element.style.boxShadow;
        const originalMargin = element.style.margin;
        element.style.boxShadow = 'none';
        element.style.margin = '0';
        
        html2canvas(element, {
            scale: 2, // Higher quality
            backgroundColor: null, // Use element's background
            useCORS: true,
            height: element.scrollHeight, // Ensure full height capture
            windowHeight: element.scrollHeight + 100 // Add buffer
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `GymCard_${new Date().getTime()}.png`;
            link.href = canvas.toDataURL();
            link.click();
            
            // Restore styles
            element.style.boxShadow = originalBoxShadow;
            element.style.margin = originalMargin;
            outputContent.style.maxHeight = originalMaxHeight;
            outputContent.style.overflow = originalOverflow;
        }).catch(err => {
            console.error('Export failed:', err);
            // Restore styles on error too
            element.style.boxShadow = originalBoxShadow;
            element.style.margin = originalMargin;
            outputContent.style.maxHeight = originalMaxHeight;
            outputContent.style.overflow = originalOverflow;
        });
    });

    clearBtn.addEventListener('click', () => {
        if (isTyping) {
            clearInterval(typingInterval);
            isTyping = false;
        }
        outputTextEl.textContent = '';
        lastOutputText = '';
        outputSection.scrollTop = 0;
        outputActions.classList.add('hidden');
    });

    copyBtn.addEventListener('click', async () => {
        const text = lastOutputText.trim();
        if (!text) {
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
        } catch (_) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', 'true');
            textarea.style.position = 'fixed';
            textarea.style.top = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
    });

    topBtn.addEventListener('click', () => {
        const cardPreview = document.getElementById('card-preview');
        cardPreview.scrollTop = 0;
        outputSection.scrollTop = 0;
    });

    // Core Functions
    async function generatePlan(data) {
        if (requestInFlight) {
            return;
        }

        const nowMs = Date.now();
        const minIntervalMs = 2000;
        if (nowMs - lastRequestAt < minIntervalMs) {
            typeWriter(`> SYSTEM ERROR: \n > 请求过于频繁，请稍等 ${(minIntervalMs - (nowMs - lastRequestAt))}ms 再试。`);
            return;
        }
        lastRequestAt = nowMs;

        // Show loading state
        outputTextEl.textContent = '\n> 读取用户信息...\n> 计算训练与饮食参数...\n> 生成增肌方案...';
        lastOutputText = outputTextEl.textContent;
        generateBtn.disabled = true;
        generateBtn.textContent = '正在计算...';
        requestInFlight = true;

        const prompt = promptTemplate
            .replace(/- 身高：.*/g, `- 身高：${data.height}cm`)
            .replace(/- 体重：.*/g, `- 体重：${data.weight}kg`)
            .replace(/- 性别：.*/g, `- 性别：${data.gender}`)
            .replace(/- 训练经验（例如：可做多少个俯卧撑\/引体）：.*/g, `- 训练经验（例如：可做多少个俯卧撑/引体）：${data.experience}`)
            .replace(/- 体型描述（偏瘦\s*\/\s*正常\s*\/\s*偏胖）：.*/g, `- 体型描述（偏瘦 / 正常 / 偏胖）：${data.bodyType}`)
            .replace(/- 目标（例如：胸肌变厚、腹肌更饱满、整体增肌）：.*/g, `- 目标（例如：胸肌变厚、腹肌更饱满、整体增肌）：${data.goal}`)
            .replace(/- 是否有器械（例如：无器械\s*\/\s*只有瑜伽垫\s*\/\s*有哑铃）：.*/g, `- 是否有器械（例如：无器械 / 只有瑜伽垫 / 有哑铃）：${data.equipment}`)
            + `\n\n额外要求：语气专业克制，不要中二/夸张修辞；不要使用赛博朋克/终端角色扮演；总字数尽量控制在 900-1400 字。`;

        try {
            const responseText = await callGeminiAPI(prompt);
            const normalized = String(responseText ?? '').trim();
            // Remove truncation limit
            const finalText = normalized;
            
            typeWriter(finalText);
            outputActions.classList.remove('hidden');

        } catch (error) {
            console.error('Gemini API Error:', error);
            
            let errorMessage = '未知错误，请检查控制台日志。';
            const raw = (() => {
                try {
                    return JSON.stringify(error, Object.getOwnPropertyNames(error));
                } catch (_) {
                    return String(error);
                }
            })();

            const message = String(error?.message ?? '');
            const status = String(error?.status ?? '');
            const is429 = status === '429' || message.includes('429') || message.toLowerCase().includes('quota');

            if (is429) {
                const isZeroQuota = raw.includes('"quota_limit_value":"0"') || raw.includes('"quota_limit_value":0');
                if (isZeroQuota) {
                    errorMessage = `API 配额为 0（该项目当前不允许 API 调用）。

当前模型: ${apiModel}
建议:
1) 在 AI Studio 生成 API Key 时切换到另一个 Google Cloud 项目再试
2) 或在 Google Cloud Console 为当前项目申请/启用 Gemini API 配额

原始错误: ${raw}`.trim();
                } else {
                    errorMessage = `API 调用过于频繁 (Quota Exceeded)。
                
当前模型: ${apiModel}
注意: API Key 的配额与 AI Studio 网页版是分开的。
"Latest" 或 "Pro" 模型通常有更严格的 API 调用限制 (如 2次/分钟)。
建议:
1) 等待 60 秒后再试
2) 在 AI Studio 重新生成一个新 Key 再试
3) 尝试换一个网络/浏览器隐身模式

原始错误: ${raw}`.trim();
                }
            } else if (message.includes('401') || message.includes('API key')) {
                errorMessage = 'API Key 无效。请在设置中重新输入。';
            } else if (message.includes('404') || message.includes('Not Found')) {
                errorMessage = `模型 ${apiModel} 未找到 (404)。
请检查模型名称是否正确，或该模型是否已弃用。`;
            } else {
                errorMessage = `请求失败: ${message || raw}`;
            }

            typeWriter(`> SYSTEM ERROR: \n > ${errorMessage}`);
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = '生成计划 [ENTER]';
            requestInFlight = false;
        }
    }

    async function callGeminiAPI(prompt) {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: apiModel,
            contents: prompt
        });
        return response.text;
    }

    function typeWriter(text) {
        isTyping = true;
        lastOutputText = text;
        outputTextEl.textContent = '';
        outputTextEl.style.display = 'inline'; // Reset to inline for typing
        outputTextEl.style.whiteSpace = 'pre-wrap'; // Preserve whitespace for typing
        
        let i = 0;
        const len = text.length;
        const intervalMs = 16;
        const chunkSize = len > 2000 ? 60 : len > 1000 ? 30 : len > 500 ? 12 : 4;

        typingInterval = setInterval(() => {
            if (i >= len) {
                clearInterval(typingInterval);
                isTyping = false;
                // Final render: Convert Markdown to HTML
                try {
                    outputTextEl.innerHTML = marked.parse(text);
                    outputTextEl.style.display = 'block'; // Switch to block for HTML content
                    outputTextEl.style.whiteSpace = 'normal'; // Standard HTML spacing
                } catch (e) {
                    console.error('Markdown parsing error:', e);
                    outputTextEl.textContent = text;
                }
                return;
            }

            const next = Math.min(len, i + chunkSize);
            outputTextEl.textContent += text.slice(i, next);
            i = next;
            outputSection.scrollTop = outputSection.scrollHeight;
        }, intervalMs);
    }
});
