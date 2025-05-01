// إعدادات افتراضية
const defaultSettings = {
  selectedModel: 'gemini',
  autoSubmitForms: false,
  showNotificationsOnPage: true,
  formFillDelay: 100,
  language: 'ar' // إضافة اللغة الافتراضية
};

// الإعدادات النشطة حاليًا
let currentSettings = { ...defaultSettings };

// إنشاء عنصر الإشعارات
let notificationElement = null;

// تخزين آخر قيم تم ملؤها للتراجع
let lastFilledInputs = [];

// تلقي مرجع ملف الترجمات
let translationsModule;

// استيراد وحدة الترجمات من ملف منفصل
try {
  // محاولة الاستيراد من ملف translations.js
  import(chrome.runtime.getURL('js/translations.js'))
    .then(module => {
      translationsModule = module;
      console.log('تم تحميل ملف الترجمات بنجاح');
    })
    .catch(error => {
      console.error('فشل في تحميل ملف الترجمات:', error);
    });
} catch (e) {
  console.warn('فشل في استيراد ملف الترجمات، سيتم استخدام الترجمات المضمنة', e);
}

// الترجمات المبسطة للإشعارات (نسخة مصغرة من ملف الترجمات الرئيسي)
const notificationTranslations = {
  ar: {
    fillingInputs: "جاري ملء {count} حقل...",
    filledInputsProgress: "تم ملء {filled} من {total} حقل...",
    filledInputsSuccess: "تم ملء {count} حقل بنجاح!",
    noInputsFilled: "لم يتم ملء أي حقول",
    undoInProgress: "جاري التراجع عن الملء السابق...",
    undoSuccess: "تم التراجع عن الملء السابق بنجاح",
    noUndoAvailable: "لا توجد عمليات ملء سابقة للتراجع عنها",
    undo: "تراجع",
    close: "إغلاق",
    status: {
      fieldFillError: "تعذر ملء الحقل",
      unknownError: "خطأ غير معروف",
      invalidResponse: "استجابة غير صالحة من الذكاء الاصطناعي"
    }
  },
  en: {
    fillingInputs: "Filling {count} fields...",
    filledInputsProgress: "Filled {filled} of {total} fields...",
    filledInputsSuccess: "Successfully filled {count} fields!",
    noInputsFilled: "No fields were filled",
    undoInProgress: "Undoing previous fill...",
    undoSuccess: "Successfully undid previous fill",
    noUndoAvailable: "No previous fill actions to undo",
    undo: "Undo",
    close: "Close",
    status: {
      fieldFillError: "Failed to fill field",
      unknownError: "Unknown error",
      invalidResponse: "Invalid response from AI"
    }
  }
};

// الحصول على نص مترجم
function getNotificationText(key, replacements = {}) {
  const lang = currentSettings.language || 'ar';
  
  // أولًا نحاول استخدام وحدة الترجمات الخارجية إذا كانت متاحة
  if (translationsModule && translationsModule.getTranslation) {
    try {
      const translatedText = translationsModule.getTranslation(lang, key);
      
      // إذا تم العثور على ترجمة، قم بتطبيق الاستبدالات وإرجاعها
      if (translatedText && translatedText !== key) {
        if (translationsModule.formatTranslation) {
          return translationsModule.formatTranslation(translatedText, replacements);
        } else {
          // استبدال المتغيرات يدويًا إذا لم تكن دالة formatTranslation متوفرة
          let text = translatedText;
          if (replacements && typeof text === 'string') {
            Object.keys(replacements).forEach(key => {
              text = text.replace(new RegExp(`{${key}}`, 'g'), replacements[key]);
            });
          }
          return text;
        }
      }
    } catch (e) {
      console.warn('خطأ في استخدام وحدة الترجمات:', e);
    }
  }
  
  // إذا لم تنجح الطريقة السابقة، استخدم الترجمات المضمنة
  const translations = notificationTranslations[lang] || notificationTranslations.ar;
  
  // التعامل مع المفاتيح المتداخلة (مثل status.fieldFillError)
  let text = key;
  const keys = key.split('.');
  let result = translations;
  
  // التنقل عبر الكائنات المتداخلة
  for (const k of keys) {
    if (result && result[k] !== undefined) {
      result = result[k];
    } else {
      // إذا لم يتم العثور على المفتاح، أرجع المفتاح نفسه
      result = key;
      break;
    }
  }
  
  if (typeof result === 'string') {
    text = result;
  }
  
  // استبدال المتغيرات
  if (replacements && typeof text === 'string') {
    Object.keys(replacements).forEach(key => {
      text = text.replace(new RegExp(`{${key}}`, 'g'), replacements[key]);
    });
  }
  
  return text;
}

function createNotificationElement() {
  // إذا كان العنصر موجودًا بالفعل، لا تنشئه مرة أخرى
  if (notificationElement) return;

  notificationElement = document.createElement('div');
  notificationElement.id = 'auto-inputs-pro-notification';
  
  // أسلوب الإشعار
  const styles = `
    #auto-inputs-pro-notification {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 15px 25px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      border-radius: 8px;
      font-family: 'Tajawal', 'Cairo', Arial, sans-serif;
      font-size: 14px;
      z-index: 9999;
      transition: opacity 0.3s, transform 0.3s;
      opacity: 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      max-width: 90%;
      text-align: center;
      direction: rtl;
    }
    
    #auto-inputs-pro-notification.show {
      opacity: 1;
    }
    
    #auto-inputs-pro-notification.hide {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    
    #auto-inputs-pro-loader {
      display: inline-block;
      width: 15px;
      height: 15px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
      margin-left: 10px;
    }
    
    .notification-actions {
      display: flex;
      margin-top: 8px;
      justify-content: center;
      gap: 8px;
    }
    
    .notification-btn {
      padding: 5px 10px;
      border-radius: 4px;
      border: none;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .undo-btn {
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
    }
    
    .undo-btn:hover {
      background-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }
    
    .dismiss-btn {
      background-color: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
    }
    
    .dismiss-btn:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  
  // إضافة الأسلوب إلى الصفحة
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
  
  // إضافة عنصر الإشعار
  document.body.appendChild(notificationElement);
}

// عرض الإشعارات - مع دعم الترجمة
function showNotification(messageKey, isLoading = false, duration = 3000, showUndoButton = false, replacements = {}) {
  // التحقق من إعدادات عرض الإشعارات
  if (!currentSettings.showNotificationsOnPage) {
    console.log('Auto-Inputs-Pro:', getNotificationText(messageKey, replacements));
    return;
  }
  
  createNotificationElement();
  
  // الحصول على النص المترجم
  const message = getNotificationText(messageKey, replacements);
  
  // إنشاء محتوى الإشعار
  let content = document.createElement('div');
  content.textContent = message;
  
  // إنشاء حاوية للإشعار
  notificationElement.innerHTML = '';
  notificationElement.appendChild(content);
  
  if (isLoading) {
    const loader = document.createElement('span');
    loader.id = 'auto-inputs-pro-loader';
    content.appendChild(loader);
  }
  
  // إضافة أزرار العمليات إذا تم طلبها
  if (showUndoButton) {
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'notification-actions';
    
    // زر التراجع
    const undoBtn = document.createElement('button');
    undoBtn.className = 'notification-btn undo-btn';
    undoBtn.textContent = getNotificationText('undo');
    undoBtn.addEventListener('click', () => {
      undoLastFill();
      hideNotification();
    });
    
    // زر الإغلاق
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'notification-btn dismiss-btn';
    dismissBtn.textContent = getNotificationText('close');
    dismissBtn.addEventListener('click', hideNotification);
    
    actionsDiv.appendChild(undoBtn);
    actionsDiv.appendChild(dismissBtn);
    notificationElement.appendChild(actionsDiv);
  }
  
  // إظهار الإشعار
  notificationElement.classList.remove('hide');
  notificationElement.classList.add('show');
  
  // إخفاء الإشعار تلقائيًا بعد فترة محددة إذا لم يكن في وضع التحميل
  if (!isLoading && !showUndoButton) {
    setTimeout(() => {
      hideNotification();
    }, duration);
  }
}

// إخفاء الإشعار
function hideNotification() {
  if (notificationElement) {
    notificationElement.classList.remove('show');
    notificationElement.classList.add('hide');
  }
}

// التراجع عن آخر عملية ملء
function undoLastFill() {
  if (lastFilledInputs.length === 0) {
    console.log('Auto-Inputs-Pro:', getNotificationText('noUndoAvailable'));
    return;
  }
  
  // إظهار إشعار البدء
  showNotification('undoInProgress', true);
  
  // مسح القيم من الحقول المملوءة
  lastFilledInputs.forEach(entry => {
    try {
      // استعادة القيمة السابقة (إن وجدت)
      if (entry.element && entry.element.isConnected) {
        if (entry.elementType === 'input' || entry.elementType === 'textarea') {
          entry.element.value = entry.previousValue || '';
          
          // تشغيل أحداث للإعلام بالتغيير
          const event = new Event('input', { bubbles: true });
          entry.element.dispatchEvent(event);
          entry.element.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (entry.elementType === 'contenteditable') {
          entry.element.textContent = entry.previousValue || '';
        }
      }
    } catch (e) {
      console.error('Auto-Inputs-Pro: خطأ في التراجع عن الملء', e);
    }
  });
  
  // مسح قائمة الحقول المملوءة
  lastFilledInputs = [];
  
  // إظهار إشعار الانتهاء
  hideNotification();
  showNotification('undoSuccess', false, 3000);
}

// تخزين الحقل المملوء وقيمته السابقة
function addToFilledInputs(element, previousValue) {
  // تحديد نوع العنصر
  let elementType = 'input';
  if (element.tagName.toLowerCase() === 'textarea') {
    elementType = 'textarea';
  } else if (element.getAttribute('contenteditable') === 'true') {
    elementType = 'contenteditable';
  }
  
  // إضافة العنصر إلى القائمة
  lastFilledInputs.push({
    element,
    elementType,
    previousValue
  });
}

// الحصول على معلومات العنصر والسياق
function getElementInfo(element) {
  // استخراج معلومات الحقل
  const tagName = element.tagName.toLowerCase();
  const type = element.type || 'text';
  const id = element.id || '';
  const name = element.name || '';
  const placeholder = element.placeholder || '';
  const label = getAssociatedLabelText(element);
  const classes = Array.from(element.classList).join(' ');
  const ariaLabel = element.getAttribute('aria-label') || '';
  const ariaLabelledby = element.getAttribute('aria-labelledby') || '';
  let labelledByText = '';
  
  // محاولة الحصول على النص من عنصر aria-labelledby
  if (ariaLabelledby) {
    const labelledByElement = document.getElementById(ariaLabelledby);
    if (labelledByElement) {
      labelledByText = labelledByElement.textContent || '';
    }
  }
  
  // الحصول على قائمة العناصر السابقة (مثل العناوين)
  const previousElements = [];
  let current = element.previousElementSibling;
  for (let i = 0; i < 3 && current; i++) {
    if (current.textContent && current.textContent.trim()) {
      previousElements.unshift(current.textContent.trim());
    }
    current = current.previousElementSibling;
  }
  
  // الحصول على النص المحيط بالعنصر
  const parentText = element.parentElement ? element.parentElement.textContent.trim().substring(0, 100) : '';
  
  // الحصول على بعض معلومات الصفحة
  const pageTitle = document.title;
  const pageUrl = window.location.href;
  
  // تحديد لغة العنصر أو الصفحة
  const elementLang = element.getAttribute('lang') || document.documentElement.lang || 'unknown';
  
  // إنشاء كائن بالمعلومات
  return {
    tagName,
    type,
    id,
    name,
    placeholder,
    label,
    classes,
    ariaLabel,
    labelledByText,
    previousElements,
    parentText,
    pageTitle,
    pageUrl,
    elementLang
  };
}

// البحث عن نص التسمية المرتبط بالعنصر
function getAssociatedLabelText(element) {
  // البحث عن تسمية عبر for/id
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label && label.textContent.trim()) {
      return label.textContent.trim();
    }
  }
  
  // البحث عن تسمية تحتوي على العنصر
  let parent = element.parentElement;
  while (parent && parent.tagName.toLowerCase() !== 'label') {
    parent = parent.parentElement;
  }
  
  if (parent && parent.tagName.toLowerCase() === 'label' && parent.textContent.trim()) {
    return parent.textContent.trim();
  }
  
  return '';
}

// إنشاء النص الذي سيتم إرساله إلى الذكاء الاصطناعي
function createAIPrompt(elementInfo) {
  const { 
    tagName, type, name, placeholder, label, ariaLabel, labelledByText, 
    previousElements, pageTitle, elementLang 
  } = elementInfo;
  
  // تحديد نوع الحقل بوضوح للذكاء الاصطناعي
  let fieldTypeDescription;
  
  switch(type) {
    case 'email':
      fieldTypeDescription = 'عنوان بريد إلكتروني حقيقي وواقعي';
      break;
    case 'password':
      fieldTypeDescription = 'كلمة مرور قوية تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز خاصة';
      break;
    case 'tel':
    case 'phone':
      fieldTypeDescription = 'رقم هاتف حقيقي (مع رمز الدولة إذا أمكن)';
      break;
    case 'number':
      fieldTypeDescription = 'قيمة رقمية مناسبة';
      break;
    case 'date':
      fieldTypeDescription = 'تاريخ واقعي بالتنسيق المناسب';
      break;
    case 'search':
      fieldTypeDescription = 'عبارة بحث واقعية';
      break;
    case 'url':
      fieldTypeDescription = 'عنوان URL حقيقي وواقعي';
      break;
    default:
      fieldTypeDescription = 'نص واقعي ومناسب';
  }
  
  // بناء النص لشرح السياق
  let prompt = `أنا أقوم بملء نموذج على موقع ويب حول "${pageTitle || 'صفحة ويب'}".
أحتاج إلى قيمة مناسبة لحقل إدخال من نوع: ${type || 'نص'}.

معلومات حول الحقل:`;
  
  // إضافة جميع المعلومات المتوفرة عن الحقل
  if (label) prompt += `\n- نص التسمية: ${label}`;
  if (placeholder) prompt += `\n- النص البديل: ${placeholder}`;
  if (name) prompt += `\n- اسم الحقل: ${name}`;
  if (ariaLabel) prompt += `\n- تسمية aria: ${ariaLabel}`;
  if (labelledByText) prompt += `\n- نص مرتبط: ${labelledByText}`;
  if (previousElements.length > 0) prompt += `\n- النصوص القريبة: ${previousElements.join(', ')}`;
  if (elementLang) prompt += `\n- لغة العنصر: ${elementLang}`;
  
  // طلب محدد للذكاء الاصطناعي
  prompt += `\n\nيرجى تقديم ${fieldTypeDescription} مناسب لهذا الحقل.
مطلوب فقط القيمة النهائية دون أي تفسير أو وصف. 
لا تستخدم مثال أو الإجابات المعتادة مثل test@example.com.
قدم بيانات واقعية ومختلفة تبدو كأنها من مستخدم حقيقي وليست بيانات اختبار واضحة.`;

  return prompt;
}

// استخراج القيمة المناسبة من استجابة الذكاء الاصطناعي
function extractValueFromAIResponse(response, fieldInfo) {
  try {
    // التأكد من أن الاستجابة هي نص
    if (response === null || response === undefined) {
      console.warn('استجابة الذكاء الاصطناعي فارغة أو غير معرفة');
      return generateRandomValue(fieldInfo);
    }
    
    // تحويل الاستجابة إلى نص إذا لم تكن كذلك
    let responseText = typeof response === 'string' ? response : String(response);
    
    // تحقق أولاً إذا كانت الاستجابة بتنسيق JSON
    try {
      const jsonResponse = JSON.parse(responseText);
      if (jsonResponse && jsonResponse.value) {
        return jsonResponse.value;
      }
    } catch (e) {
      // ليست بتنسيق JSON، استمر
    }
    
    // تنظيف الاستجابة لاستخراج النص المفيد
    let cleanedResponse = responseText;
    
    // إزالة الأقواس المربعة وما بينها، مثل [مثال]
    cleanedResponse = cleanedResponse.replace(/\[([^\]]+)\]/g, '');
    
    // إزالة الكلمات التي تشير إلى أن هذا مجرد اقتراح
    const suggestWords = ['اقترح', 'ربما', 'يمكن', 'قد يكون', 'قد تكون', 'هذه', 'هذا'];
    suggestWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b\\s*`, 'gi');
      cleanedResponse = cleanedResponse.replace(regex, '');
    });
    
    // تنظيف من علامات التنصيص
    cleanedResponse = cleanedResponse.replace(/["']/g, '');
    
    // إزالة أي علامات HTML
    cleanedResponse = cleanedResponse.replace(/<[^>]*>/g, '');
    
    // تنظيف النص من الأسطر الجديدة والمسافات المكررة
    cleanedResponse = cleanedResponse.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
    
    // إذا كان النص طويلًا جدًا، يتم اقتصاصه
    const maxLength = fieldInfo.type === 'textarea' ? 500 : 100;
    if (cleanedResponse.length > maxLength) {
      cleanedResponse = cleanedResponse.substring(0, maxLength);
    }
    
    // إذا كانت الاستجابة فارغة أو تحتوي على النص المثال (test@example.com)، استخدم قيمة عشوائية
    if (!cleanedResponse || 
        cleanedResponse.trim() === '' || 
        cleanedResponse.includes('test@example.com') ||
        cleanedResponse.includes('Test@12345')) {
      return generateRandomValue(fieldInfo);
    }
    
    return cleanedResponse;
  } catch (error) {
    console.error('خطأ في استخراج القيمة من استجابة الذكاء الاصطناعي:', error);
    return generateRandomValue(fieldInfo);
  }
}

/**
 * إنشاء قيمة عشوائية بناءً على نوع الحقل
 * @param {Object} fieldInfo - معلومات الحقل
 * @returns {string} - قيمة عشوائية مناسبة
 */
function generateRandomValue(fieldInfo) {
  const type = fieldInfo.type || 'text';
  const label = (fieldInfo.label || '').toLowerCase();
  const name = (fieldInfo.name || '').toLowerCase();
  const placeholder = (fieldInfo.placeholder || '').toLowerCase();
  
  // قائمة بالأسماء العربية الشائعة
  const arabicFirstNames = ['محمد', 'أحمد', 'علي', 'عمر', 'خالد', 'سعد', 'فهد', 'عبدالله', 'يوسف', 'إبراهيم', 'سلمان', 'فيصل', 'سعود', 'ماجد', 'نايف', 'طارق', 'سامي', 'رياض', 'نواف', 'بندر', 'ناصر', 'راشد', 'سلطان', 'تركي', 'عبدالرحمن', 'عبدالعزيز', 'زياد', 'هاني', 'وليد', 'بشار'];
  const arabicLastNames = ['الشمري', 'العتيبي', 'القحطاني', 'السبيعي', 'الحربي', 'المطيري', 'العنزي', 'الدوسري', 'الغامدي', 'الزهراني', 'الشهري', 'البلوي', 'العمري', 'الهاجري', 'الرشيدي', 'الجهني', 'البقمي', 'الظفيري', 'الحربي', 'الغانم', 'الشهراني', 'المالكي', 'العطوي', 'البكري', 'الناصر', 'الفهد', 'المهنا', 'السعيد', 'الحميد', 'المرشد'];
  
  // قائمة بنطاقات البريد الإلكتروني الشائعة
  const emailDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'mail.com', 'protonmail.com', 'aol.com', 'zoho.com', 'yandex.com'];
  
  // قائمة بأسماء الشركات العشوائية
  const companyNames = ['شركة التقنية المتقدمة', 'مؤسسة الابتكار', 'شركة النجاح العالمية', 'مجموعة التميز', 'شركة الريادة', 'مؤسسة المستقبل', 'شركة الإبداع التقني', 'مجموعة الخليج', 'شركة الاتحاد', 'المؤسسة الوطنية'];
  
  // القيم الاحتمالية بناءً على نوع الحقل
  switch (type) {
    case 'email':
      const randomNum = Math.floor(Math.random() * 1000);
      const firstName = arabicFirstNames[Math.floor(Math.random() * arabicFirstNames.length)].toLowerCase();
      const lastName = arabicLastNames[Math.floor(Math.random() * arabicLastNames.length)].toLowerCase();
      const emailDomain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
      // إنشاء عنوان بريد إلكتروني عشوائي مع بعض التنوع في الأنماط
      const emailPatterns = [
        `${firstName}${randomNum}@${emailDomain}`,
        `${firstName}.${lastName}@${emailDomain}`,
        `${firstName}_${lastName}@${emailDomain}`,
        `${firstName}${lastName}${Math.floor(Math.random() * 100)}@${emailDomain}`,
        `${firstName.charAt(0)}${lastName}${Math.floor(Math.random() * 100)}@${emailDomain}`
      ];
      return emailPatterns[Math.floor(Math.random() * emailPatterns.length)];
      
    case 'password':
      // إنشاء كلمة مرور قوية
      const upperChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
      const lowerChars = 'abcdefghijkmnopqrstuvwxyz';
      const numbers = '123456789';
      const specialChars = '!@#$%^&*()_-+=<>?';
      let password = '';
      // إضافة حرف كبير عشوائي
      password += upperChars.charAt(Math.floor(Math.random() * upperChars.length));
      // إضافة 5-7 أحرف صغيرة عشوائية
      for (let i = 0; i < 5 + Math.floor(Math.random() * 3); i++) {
        password += lowerChars.charAt(Math.floor(Math.random() * lowerChars.length));
      }
      // إضافة 2-3 أرقام عشوائية
      for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
        password += numbers.charAt(Math.floor(Math.random() * numbers.length));
      }
      // إضافة 1-2 رموز خاصة عشوائية
      for (let i = 0; i < 1 + Math.floor(Math.random() * 2); i++) {
        password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
      }
      return password;
      
    case 'tel':
    case 'phone':
      // إنشاء رقم هاتف سعودي عشوائي
      const areaCodes = ['50', '53', '54', '55', '56', '58', '59'];
      const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
      const phoneNumber = Math.floor(10000000 + Math.random() * 90000000);
      return `+966${areaCode}${phoneNumber}`.substring(0, 13);
      
    case 'number':
      // تحقق إذا كان الحقل يتعلق بالعمر
      if (label.includes('عمر') || name.includes('age') || placeholder.includes('age')) {
        return String(18 + Math.floor(Math.random() * 62)); // عمر بين 18 و 80
      }
      // تحقق إذا كان الحقل يتعلق بالسعر
      if (label.includes('سعر') || name.includes('price') || placeholder.includes('price')) {
        return String(50 + Math.floor(Math.random() * 9950)); // سعر بين 50 و 10000
      }
      // رقم عشوائي بين 1 و 100 كقيمة افتراضية
      return String(1 + Math.floor(Math.random() * 100));
      
    case 'date':
      // تحقق إذا كان الحقل يتعلق بتاريخ الميلاد
      if (label.includes('ميلاد') || name.includes('birth') || placeholder.includes('birth')) {
        const year = 1970 + Math.floor(Math.random() * 35);
        const month = 1 + Math.floor(Math.random() * 12);
        const day = 1 + Math.floor(Math.random() * 28);
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      }
      // تاريخ عشوائي في المستقبل القريب
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + Math.floor(Math.random() * 60)); // تاريخ خلال الشهرين القادمين
      return `${futureDate.getFullYear()}-${(futureDate.getMonth() + 1).toString().padStart(2, '0')}-${futureDate.getDate().toString().padStart(2, '0')}`;
      
    case 'url':
      // إنشاء عنوان URL عشوائي
      const urlDomains = ['example.com', 'website.net', 'mysite.org', 'company.sa', 'blog.io', 'shop.com', 'online.net'];
      const subdomains = ['www', 'blog', 'shop', 'store', 'app', 'mail', ''];
      const paths = ['', 'about', 'contact', 'products', 'services', 'blog', 'news'];
      
      const urlDomain = urlDomains[Math.floor(Math.random() * urlDomains.length)];
      const subdomain = subdomains[Math.floor(Math.random() * subdomains.length)];
      const path = paths[Math.floor(Math.random() * paths.length)];
      
      return subdomain 
        ? `https://${subdomain}.${urlDomain}/${path}` 
        : `https://${urlDomain}/${path}`;
      
    default:
      // تحقق إذا كان الحقل يتعلق بالاسم
      if (label.includes('اسم') || name.includes('name') || placeholder.includes('name')) {
        // الاسم الكامل
        if (label.includes('كامل') || name.includes('full') || placeholder.includes('full')) {
          const firstNameFull = arabicFirstNames[Math.floor(Math.random() * arabicFirstNames.length)];
          const lastNameFull = arabicLastNames[Math.floor(Math.random() * arabicLastNames.length)];
          return `${firstNameFull} ${lastNameFull}`;
        }
        // الاسم الأول
        if (label.includes('أول') || name.includes('first') || placeholder.includes('first')) {
          return arabicFirstNames[Math.floor(Math.random() * arabicFirstNames.length)];
        }
        // اسم العائلة
        if (label.includes('عائلة') || label.includes('أخير') || name.includes('last') || placeholder.includes('last')) {
          return arabicLastNames[Math.floor(Math.random() * arabicLastNames.length)];
        }
        // اسم عشوائي كامل
        const firstNameRandom = arabicFirstNames[Math.floor(Math.random() * arabicFirstNames.length)];
        const lastNameRandom = arabicLastNames[Math.floor(Math.random() * arabicLastNames.length)];
        return `${firstNameRandom} ${lastNameRandom}`;
      }
      
      // تحقق إذا كان الحقل يتعلق بالعنوان
      if (label.includes('عنوان') || name.includes('address') || placeholder.includes('address')) {
        const streets = ['شارع الملك فهد', 'طريق الأمير محمد', 'شارع التحلية', 'شارع العليا', 'طريق الملك عبدالله', 'شارع الستين', 'طريق الأمير سلطان'];
        const cities = ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة', 'الطائف', 'أبها', 'بريدة'];
        const street = streets[Math.floor(Math.random() * streets.length)];
        const buildingNumber = Math.floor(Math.random() * 500) + 1;
        const city = cities[Math.floor(Math.random() * cities.length)];
        return `${street}، مبنى رقم ${buildingNumber}، ${city}`;
      }
      
      // تحقق إذا كان الحقل يتعلق بالمدينة
      if (label.includes('مدينة') || name.includes('city') || placeholder.includes('city')) {
        const cities = ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة المنورة', 'الطائف', 'أبها', 'بريدة', 'الخبر', 'تبوك', 'حائل', 'نجران', 'جازان', 'سكاكا', 'القريات'];
        return cities[Math.floor(Math.random() * cities.length)];
      }
      
      // تحقق إذا كان الحقل يتعلق بالبلد
      if (label.includes('بلد') || label.includes('دولة') || name.includes('country') || placeholder.includes('country')) {
        const countries = ['المملكة العربية السعودية', 'الإمارات العربية المتحدة', 'قطر', 'الكويت', 'البحرين', 'سلطنة عمان', 'مصر', 'الأردن', 'لبنان'];
        return countries[Math.floor(Math.random() * countries.length)];
      }
      
      // تحقق إذا كان الحقل يتعلق بالشركة
      if (label.includes('شركة') || name.includes('company') || placeholder.includes('company')) {
        return companyNames[Math.floor(Math.random() * companyNames.length)];
      }
      
      // تحقق إذا كان الحقل يتعلق بالرمز البريدي
      if (label.includes('رمز بريدي') || name.includes('zip') || name.includes('postal') || placeholder.includes('postal')) {
        return String(10000 + Math.floor(Math.random() * 90000)); // رمز بريدي من 5 أرقام
      }
      
      // للمناطق النصية تحتاج إلى نص أطول
      if (fieldInfo.tagName === 'TEXTAREA') {
        const comments = [
          'أنا سعيد جدًا بالخدمة التي قدمتموها لي. كان فريق العمل محترفًا ومتعاونًا للغاية. سأوصي بكم لأصدقائي وعائلتي.',
          'كانت تجربتي مع المنتج ممتازة. جودة عالية وسعر مناسب. شكرًا لكم على الاهتمام بالتفاصيل وخدمة العملاء الرائعة.',
          'أقدر تفانيكم في تقديم خدمة متميزة. كل شيء كان أفضل مما توقعت. سأتعامل معكم مرة أخرى في المستقبل بالتأكيد.',
          'تجربة رائعة من البداية إلى النهاية. المنتج وصل في الوقت المحدد وبحالة ممتازة. شكرًا لكم على الاحترافية العالية.',
          'أعجبني التصميم والجودة. تفوق توقعاتي بكثير. استجابتكم السريعة للاستفسارات كانت محل تقدير كبير.'
        ];
        return comments[Math.floor(Math.random() * comments.length)];
      }
      
      // قائمة بالعبارات القصيرة العشوائية للحقول النصية العامة
      const generalTexts = [
        'معلومات إضافية',
        'خدمة ممتازة',
        'تجربة رائعة',
        'اقتراح للتحسين',
        'تعليق عام',
        'مراجعة إيجابية',
        'ملاحظات عامة',
        'رأي شخصي',
        'للتواصل مستقبلاً',
        'شكراً لكم'
      ];
      return generalTexts[Math.floor(Math.random() * generalTexts.length)];
  }
}

// تطبيق القيمة على حقل الإدخال
function applyValueToField(element, value) {
  // تخزين القيمة السابقة للعنصر قبل تغييرها
  const previousValue = element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'textarea' ?
    element.value :
    (element.textContent || '');
  
  // تخزين العنصر في قائمة الحقول المملوءة
  addToFilledInputs(element, previousValue);

  // محاولة تنفيذ ملء الحقل
  try {
    // التعامل مع الحقول المختلفة
    if (element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'textarea') {
      // تحديث قيمة الحقل
      element.value = value;
      
      // إطلاق أحداث لتحديث الحالة وتنبيه مكتبات أخرى
      const inputEvent = new Event('input', { bubbles: true });
      element.dispatchEvent(inputEvent);
      
      const changeEvent = new Event('change', { bubbles: true });
      element.dispatchEvent(changeEvent);
      
      // محاولة إطلاق أحداث إضافية للتوافق مع بعض الأطر
      try {
        element.dispatchEvent(new Event('keydown', { bubbles: true }));
        element.dispatchEvent(new Event('keyup', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
      } catch (e) {
        // تجاهل الأخطاء في الأحداث الإضافية
      }
    } else if (element.getAttribute('contenteditable') === 'true') {
      // تعيين المحتوى القابل للتحرير
      element.textContent = value;
      
      // إطلاق أحداث للمحتوى القابل للتحرير
      const inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: value
      });
      element.dispatchEvent(inputEvent);
    }
    
    // التمرير إلى العنصر إذا كان خارج إطار الرؤية
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // إضافة تأثير بصري للإشارة إلى أن الحقل تم ملؤه
    const originalBackgroundColor = element.style.backgroundColor;
    const originalTransition = element.style.transition;
    
    element.style.transition = 'background-color 0.5s ease';
    element.style.backgroundColor = 'rgba(71, 118, 230, 0.1)';
    
    setTimeout(() => {
      element.style.backgroundColor = originalBackgroundColor;
      setTimeout(() => {
        element.style.transition = originalTransition;
      }, 500);
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('Auto-Inputs-Pro: فشل في تطبيق القيمة على الحقل', error);
    return false;
  }
}

// إضافة تأخير حسب الإعدادات
function delay(ms = null) {
  const delayTime = ms !== null ? ms : currentSettings.formFillDelay;
  return new Promise(resolve => setTimeout(resolve, delayTime));
}

// ملء حقل واحد
async function fillSingleInput(element, apiKey, settings = {}) {
  try {
    // التحقق من أن الحقل فارغ قبل ملئه
    const currentValue = element.value || element.textContent;
    if (currentValue && currentValue.trim() !== '') {
      console.log('تجاوز حقل يحتوي على قيمة بالفعل:', element, currentValue);
      return false;
    }
    
    // تحديث الإعدادات الحالية إذا تم تمريرها
    if (Object.keys(settings).length > 0) {
      currentSettings = { ...currentSettings, ...settings };
    }
    
    // الحصول على معلومات الحقل
    const elementInfo = getElementInfo(element);
    
    // إنشاء النص الذي سيتم إرساله إلى الذكاء الاصطناعي
    const prompt = createAIPrompt(elementInfo);
    
    // محاولات متعددة للاتصال
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // محاولة الاتصال بالذكاء الاصطناعي
        const response = await callAI(prompt, apiKey, currentSettings.selectedModel);
        
        // التحقق من أن الاستجابة صالحة
        if (!response || (typeof response !== 'string' && !response.text)) {
          throw new Error(getNotificationText('status.invalidResponse'));
        }
        
        // استخراج النص من الاستجابة
        const responseText = typeof response === 'string' 
          ? response 
          : (response.text || JSON.stringify(response));
        
        // استخراج القيمة المناسبة من الاستجابة
        const value = extractValueFromAIResponse(responseText, elementInfo);
        
        // تطبيق القيمة على الحقل
        applyValueToField(element, value);
        
        // تحقق مما إذا كان يجب تقديم النموذج تلقائيًا
        if (currentSettings.autoSubmitForms) {
          autoSubmitForm(element);
        }
        
        return true;
      } catch (error) {
        lastError = error;
        console.error(`محاولة ${attempt}/${maxRetries} فشلت:`, error);
        
        // إذا كان الخطأ 404، حاول مرة أخرى
        if (error.message && typeof error.message === 'string' && 
            error.message.includes('404') && attempt < maxRetries) {
          console.log(`جاري إعادة المحاولة (${attempt}/${maxRetries})...`);
          // انتظر قبل إعادة المحاولة (زيادة الانتظار مع كل محاولة)
          await delay(1000 * attempt);
          continue;
        }
        
        // أي خطأ آخر، أو المحاولة الأخيرة، اكسر الحلقة
        break;
      }
    }
    
    // جميع المحاولات فشلت
    const errorMessage = lastError && lastError.message 
      ? (typeof lastError.message === 'string' ? lastError.message : JSON.stringify(lastError.message))
      : getNotificationText('status.unknownError');
    
    showNotification(`${getNotificationText('status.fieldFillError')}: ${errorMessage}`, false, 5000);
    return false;
  } catch (error) {
    console.error(getNotificationText('status.fieldFillError'), error);
    const errorMessage = error && error.message 
      ? (typeof error.message === 'string' ? error.message : JSON.stringify(error.message))
      : getNotificationText('status.unknownError');
    
    showNotification(`${getNotificationText('status.fieldFillError')}: ${errorMessage}`, false, 5000);
    return false;
  }
}

/**
 * الحصول على جميع حقول الإدخال القابلة للملء في الصفحة الحالية
 * مع تحسين دقة اكتشاف الحقول وإضافة محاولات إضافية للعثور على حقول خفية
 * @returns {HTMLElement[]} مصفوفة من عناصر الإدخال القابلة للملء
 */
function getFillableInputs() {
  console.log("البحث عن حقول الإدخال القابلة للملء...");
  
  // جمع جميع حقول الإدخال النصية من الصفحة بشكل أكثر شمولية
  const allTextInputs = document.querySelectorAll(
    'input[type="text"], input[type="email"], input[type="password"], ' +
    'input[type="search"], input[type="tel"], input[type="url"], input[type="number"], ' +
    'input:not([type]), textarea, [contenteditable="true"], [role="textbox"]'
  );
  
  // إنشاء مصفوفة من جميع الحقول المحتملة
  const allPotentialInputs = Array.from(allTextInputs);
  
  // البحث الإضافي عن الحقول التي قد تكون مخفية في بعض الأحيان (مع التجاهل المؤقت للتنسيقات)
  const hiddenFrames = document.querySelectorAll('iframe');
  for (let frame of hiddenFrames) {
    try {
      // محاولة الوصول إلى محتوى الإطار إذا كان من نفس النطاق
      const frameDocument = frame.contentDocument || frame.contentWindow?.document;
      if (frameDocument) {
        const frameInputs = frameDocument.querySelectorAll(
          'input[type="text"], input[type="email"], input[type="password"], ' +
          'input[type="search"], input[type="tel"], input[type="url"], input[type="number"], ' +
          'input:not([type]), textarea, [contenteditable="true"], [role="textbox"]'
        );
        allPotentialInputs.push(...Array.from(frameInputs));
      }
    } catch (e) {
      // تجاهل أخطاء سياسة نفس الأصل cross-origin
    }
  }
  
  console.log(`تم العثور على ${allPotentialInputs.length} حقل محتمل للملء`);
  
  // تصفية الحقول للحصول فقط على الحقول المرئية والقابلة للكتابة فيها والفارغة
  const fillableInputs = allPotentialInputs.filter(input => {
    try {
      // التحقق من صلاحية العنصر (قد يكون جزء من إطار تم إزالته)
      if (!input || !input.isConnected) {
        return false;
      }
      
      // التحقق مما إذا كان العنصر مرئيًا للمستخدم
      if (!isElementVisible(input)) {
        console.log("تم استبعاد حقل غير مرئي:", input);
        return false;
      }
      
      // التحقق مما إذا كان العنصر تفاعليًا وقابلاً للكتابة فيه
      if (!isElementInteractive(input)) {
        console.log("تم استبعاد حقل غير تفاعلي:", input);
        return false;
      }
      
      // استبعاد حقول تأكيد كلمة المرور (عادة ما تكون الحقل الثاني من نوع كلمة المرور)
      const labelText = getAssociatedLabelText(input);
      if (
        labelText && 
        (labelText.toLowerCase().includes("confirm") || 
         labelText.toLowerCase().includes("verify") ||
         labelText.includes("تأكيد") ||
         labelText.includes("تحقق"))
      ) {
        console.log("تم استبعاد حقل تأكيد كلمة المرور:", input);
        return false;
      }
      
      // استبعاد الحقول التي تحتوي على كلمة كابتشا
      if (input.id && input.id.toLowerCase().includes("captcha") || 
          input.name && input.name.toLowerCase().includes("captcha") || 
          input.className && input.className.toLowerCase().includes("captcha")) {
        console.log("تم استبعاد حقل كابتشا:", input);
        return false;
      }
      
      // استبعاد الحقول التي تحتوي بالفعل على قيمة (تم ملؤها من قبل المستخدم)
      const value = input.value || input.textContent;
      if (value && value.trim() !== '') {
        console.log("تم استبعاد حقل يحتوي على قيمة بالفعل:", input, value);
        return false;
      }
      
      // قبول هذا الحقل كقابل للملء
      return true;
    } catch (error) {
      console.error("خطأ في تقييم حقل:", error);
      return false;
    }
  });
  
  console.log(`تم العثور على ${fillableInputs.length} حقل قابل للملء من أصل ${allPotentialInputs.length} حقل محتمل`);
  
  // إذا لم نجد أي حقول، حاول التحقق من خلال فحص الصفحة بشكل أكثر تعمقًا
  if (fillableInputs.length === 0) {
    console.log("محاولة البحث بشكل أكثر تعمقًا عن الحقول الخفية...");
    
    // المحاولة الإضافية للعثور على الحقول القابلة للملء المخفية
    const additionalInputs = Array.from(document.querySelectorAll('*')).filter(element => {
      try {
        // فحص أكثر تعمقا للعناصر التي قد تكون حقول إدخال
        if (element.tagName === 'INPUT' || 
            element.tagName === 'TEXTAREA' || 
            element.getAttribute('contenteditable') === 'true' ||
            element.getAttribute('role') === 'textbox') {
          
          // التحقق من عرض العنصر والتفاعلية
          const style = window.getComputedStyle(element);
          const isVisible = style.visibility !== 'hidden' && 
                        style.display !== 'none' && 
                        element.offsetParent !== null;
                        
          if (isVisible) {
            const value = element.value || element.textContent;
            const isEmpty = !value || value.trim() === '';
            return isEmpty;
          }
        }
        return false;
      } catch (error) {
        return false;
      }
    });
    
    console.log(`تم العثور على ${additionalInputs.length} حقل إضافي في البحث المتعمق`);
    fillableInputs.push(...additionalInputs);
  }
  
  return fillableInputs;
}

/**
 * التحقق مما إذا كان العنصر مرئيًا للمستخدم
 * @param {HTMLElement} element - العنصر المراد التحقق منه
 * @returns {boolean} ما إذا كان العنصر مرئيًا
 */
function isElementVisible(element) {
  // التحقق من خصائص العرض باستخدام CSS
  const style = window.getComputedStyle(element);
  
  if (style.display === 'none' || 
      style.visibility === 'hidden' || 
      style.opacity === '0' ||
      parseInt(style.width) === 0 ||
      parseInt(style.height) === 0) {
    return false;
  }
  
  // التحقق من السمات المتعلقة بالإخفاء
  if (element.hasAttribute('hidden') || 
      element.getAttribute('aria-hidden') === 'true') {
    return false;
  }
  
  // التحقق من موضع العنصر (إذا كان خارج نطاق الرؤية)
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return false;
  }
  
  // التحقق مما إذا كان العنصر مخفيًا خلف عنصر آخر
  if (!isElementClickable(element)) {
    return false;
  }

  // التحقق من العناصر الأب
  let parent = element.parentElement;
  while (parent) {
    const parentStyle = window.getComputedStyle(parent);
    if (parentStyle.display === 'none' || 
        parentStyle.visibility === 'hidden' || 
        parentStyle.opacity === '0' ||
        parent.hasAttribute('hidden') ||
        parent.getAttribute('aria-hidden') === 'true') {
      return false;
    }
    parent = parent.parentElement;
  }
  
  return true;
}

/**
 * التحقق مما إذا كان العنصر قابلاً للنقر عليه (غير مخفي خلف عنصر آخر)
 * @param {HTMLElement} element - العنصر المراد التحقق منه
 * @returns {boolean} ما إذا كان العنصر قابلاً للنقر عليه
 */
function isElementClickable(element) {
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  
  // التحقق مما إذا كان هناك عنصر آخر في نفس الموضع
  const elementsAtPoint = document.elementsFromPoint(x, y);
  
  // يجب أن يكون العنصر هو الأول (أو ضمن أول 3 عناصر مع مراعاة وجود عناصر تغليف)
  return elementsAtPoint.slice(0, 3).some(el => el === element || element.contains(el) || el.contains(element));
}

/**
 * التحقق مما إذا كان العنصر تفاعليًا وقابلاً للكتابة فيه
 * @param {HTMLElement} element - العنصر المراد التحقق منه
 * @returns {boolean} ما إذا كان العنصر تفاعليًا
 */
function isElementInteractive(element) {
  // التحقق من سمات عدم التفاعلية
  if (element.disabled ||
      element.readOnly ||
      element.getAttribute('disabled') === 'true' ||
      element.getAttribute('readonly') === 'true' ||
      element.getAttribute('aria-disabled') === 'true') {
    return false;
  }
  
  // التحقق مما إذا كان العنصر قابلاً للتحرير
  if (element.tagName === 'TEXTAREA' || 
      (element.tagName === 'INPUT' && !['button', 'submit', 'reset', 'image', 'file', 'checkbox', 'radio'].includes(element.type)) ||
      element.getAttribute('contenteditable') === 'true' ||
      element.getAttribute('role') === 'textbox') {
    return true;
  }
  
  return false;
}

// ملء جميع الحقول في الصفحة
async function fillAllInputs(apiKey, settings = {}) {
  // تحديث الإعدادات الحالية إذا تم تمريرها
  if (Object.keys(settings).length > 0) {
    currentSettings = { ...currentSettings, ...settings };
  }
  
  const inputs = getFillableInputs();
  let filledCount = 0;
  
  // مسح قائمة الإدخالات السابقة
  lastFilledInputs = [];
  
  showNotification('fillingInputs', true, 0, false, { count: inputs.length });
  
  for (const input of inputs) {
    try {
      const success = await fillSingleInput(input, apiKey);
      if (success) filledCount++;
      
      // تحديث الإشعار كل 5 حقول
      if (filledCount % 5 === 0) {
        showNotification('filledInputsProgress', true, 0, false, { filled: filledCount, total: inputs.length });
      }
      
      // إضافة تأخير بين الحقول
      await delay();
    } catch (error) {
      console.error('خطأ في ملء الحقل:', error);
    }
  }
  
  hideNotification();
  // عرض إشعار بالاكتمال مع زر التراجع
  if (filledCount > 0) {
    showNotification('filledInputsSuccess', false, 5000, true, { count: filledCount });
  } else {
    showNotification('noInputsFilled', false, 3000);
  }
  
  return filledCount;
}

// ملء نموذج محدد (العنصر الأب الذي يحتوي على الحقول)
async function fillForm(element, apiKey, settings = {}) {
  // تحديث الإعدادات الحالية إذا تم تمريرها
  if (Object.keys(settings).length > 0) {
    currentSettings = { ...currentSettings, ...settings };
  }
  
  // البحث عن أقرب عنصر form أو المحتوي للحقل
  let formElement = element.closest('form');
  
  // إذا لم يكن داخل form، ابحث عن عنصر أب يمكن اعتباره نموذجًا
  if (!formElement) {
    // 1. ابحث عن عناصر أب تحتوي على سمات تشير إلى أنها نماذج
    formElement = element.closest('[role="form"], [data-form], [data-role="form"], [class*="form"], [class*="Form"]');
    
    // 2. إذا لم يتم العثور على عناصر بالخطوة السابقة، ابحث للأعلى
    if (!formElement) {
      let parent = element.parentElement;
      let inputsCount = 0;
      let foundForm = false;
      
      // البحث للأعلى خلال 8 مستويات من العناصر (زيادة من 5 للحصول على نتائج أفضل)
      for (let i = 0; i < 8 && parent; i++) {
        // حساب عدد حقول الإدخال المرئية داخل هذا العنصر الأب
        const visibleInputs = Array.from(parent.querySelectorAll('input, textarea, select'))
          .filter(el => {
            // التحقق من أن الحقل مرئي وقابل للكتابة
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && 
                  style.visibility !== 'hidden' && 
                  style.opacity !== '0' &&
                  el.offsetParent !== null &&
                  !el.disabled &&
                  !el.readOnly;
          });

        inputsCount = visibleInputs.length;
        
        // إذا وجدنا عنصرًا يحتوي على 3 حقول على الأقل، نعتبره النموذج
        if (inputsCount >= 3) {
          formElement = parent;
          foundForm = true;
          console.log(`Auto-Inputs-Pro: تم العثور على نموذج يحتوي على ${inputsCount} حقل مرئي`);
          break;
        }
        
        // البحث للأعلى
        parent = parent.parentElement;
      }
      
      // إذا لم نجد عنصرًا مناسبًا، نبحث عن أقرب عنصر له تنسيق يشبه النموذج
      if (!foundForm) {
        formElement = element.closest('div, section, fieldset, .form, .form-group, [class*="form"], [class*="Form"]');
      }
    }
  }
  
  // إذا لم نجد أي عنصر مناسب، نتحقق إذا كان الحقل جزء من جدول أو قائمة
  if (!formElement) {
    formElement = element.closest('table, tbody, ul, ol, dl');
  }
  
  // كإجراء أخير، إذا لم نجد أي شيء، نستخدم أقرب حاوية
  if (!formElement) {
    formElement = element.closest('div, section, article');
  }
  
  // إذا لم نجد أي عنصر مناسب على الإطلاق، نستخدم العنصر الحالي
  if (!formElement) {
    formElement = element.parentElement || element;
  }
  
  // الحصول على جميع حقول الإدخال النصية المرئية داخل العنصر المحدد (استبعاد checkboxes و radio و select)
  const visibleInputs = Array.from(formElement.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="search"], input[type="tel"], input[type="url"], input[type="number"], input:not([type]), textarea'))
    .filter(input => {
      const style = window.getComputedStyle(input);
      // التحقق من أن الحقل مرئي وفارغ
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             style.opacity !== '0' &&
             input.offsetParent !== null &&
             input.clientHeight > 0 && input.clientWidth > 0 &&
             (!input.value || input.value.trim() === '');
    });
    
  const visibleTextareas = Array.from(formElement.querySelectorAll('textarea:not([readonly]):not([disabled])'))
    .filter(textarea => {
      const style = window.getComputedStyle(textarea);
      // التحقق من أن الحقل مرئي وفارغ
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             style.opacity !== '0' &&
             textarea.offsetParent !== null &&
             textarea.clientHeight > 0 && textarea.clientWidth > 0 &&
             (!textarea.value || textarea.value.trim() === '');
    });
  
  // حقول قابلة للكتابة مخصصة
  const visibleCustomFields = Array.from(formElement.querySelectorAll('[contenteditable="true"], [role="textbox"], [data-role="input"], [data-input="true"]'))
    .filter(field => {
      const style = window.getComputedStyle(field);
      // التحقق من أن الحقل مرئي وفارغ
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             style.opacity !== '0' &&
             field.offsetParent !== null &&
             field.clientHeight > 0 && field.clientWidth > 0 &&
             (!field.textContent || field.textContent.trim() === '');
    });
  
  // دمج جميع حقول النص فقط، وتجاهل حقول الاختيار والتحقق والأنواع الأخرى
  const allVisibleInputs = [...visibleInputs, ...visibleTextareas, ...visibleCustomFields];
  
  // إذا لم يتم العثور على أي حقول مرئية، أظهر رسالة للمستخدم
  if (allVisibleInputs.length === 0) {
    showNotification('لم يتم العثور على حقول نصية فارغة قابلة للملء في هذا النموذج', false, 4000);
    return 0;
  }
  
  let filledCount = 0;
  
  showNotification(`جاري ملء ${allVisibleInputs.length} حقل نصي في النموذج...`, true);
  
  // ملء الحقول واحدًا تلو الآخر
  for (const input of allVisibleInputs) {
    try {
      // التحقق مرة أخرى أن العنصر لا يزال مرئيًا وفارغًا
      const style = window.getComputedStyle(input);
      const value = input.value || input.textContent;
      
      if (style.display === 'none' || 
          style.visibility === 'hidden' || 
          style.opacity === '0' || 
          input.offsetParent === null ||
          (value && value.trim() !== '')) {
        console.log('تجاوز حقل أصبح غير مرئي أو تم ملؤه بالفعل:', input);
        continue;
      }
      
      // ملء الحقل
      const success = await fillSingleInput(input, apiKey);
      if (success) {
        filledCount++;
        
        // تحديث الإشعار كل 3 حقول
        if (filledCount % 3 === 0) {
          showNotification(`تم ملء ${filledCount} من ${allVisibleInputs.length} حقل...`, true);
        }
      }
      
      // إضافة تأخير بين الحقول
      await delay();
    } catch (error) {
      console.error('خطأ في ملء الحقل:', error);
    }
  }
  
  hideNotification();
  
  // إظهار رسالة النجاح
  if (filledCount > 0) {
    showNotification(`تم ملء ${filledCount} حقل نصي في النموذج بنجاح!`);
    
    // تقديم النموذج إذا كان مطلوبًا وكان عنصر form
    if (currentSettings.autoSubmitForms && formElement.tagName && formElement.tagName.toLowerCase() === 'form') {
      autoSubmitForm(allVisibleInputs[0]);
    }
  } else {
    showNotification('لم يتم ملء أي حقول. تأكد من أن النموذج يحتوي على حقول نصية فارغة قابلة للملء.');
  }
  
  // إعادة تعيين قائمة الإدخالات المملوءة
  lastFilledInputs = [];
  
  // إضافة أزرار التراجع والإلغاء
  if (filledCount > 0) {
    showNotification(`تم ملء ${filledCount} حقل في النموذج بنجاح!`, false, 5000, true);
  } else {
    showNotification('لم يتم العثور على حقول قابلة للملء في هذا النموذج', false, 3000);
  }
  
  return filledCount;
}

// تقديم النموذج تلقائيًا (إذا كان مفعلاً في الإعدادات)
function autoSubmitForm(element) {
  if (!currentSettings.autoSubmitForms) return;
  
  const form = element.closest('form');
  if (form) {
    // التحقق مما إذا كان النموذج يحتوي على زر تقديم (submit)
    const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
    
    if (submitButton) {
      // ضع تأخيرًا صغيرًا قبل تقديم النموذج
      setTimeout(() => {
        submitButton.click();
      }, 500);
    } else {
      // إذا لم يكن هناك زر تقديم، حاول تقديم النموذج مباشرة
      setTimeout(() => {
        form.submit();
      }, 500);
    }
  }
}

// الاتصال بواجهة برمجة التطبيقات الذكاء الاصطناعي المحدد
async function callAI(prompt, apiKey, model = 'gemini') {
  switch(model) {
    case 'gemini':
      return callGeminiAPI(apiKey, prompt);
    case 'openai':
      return callOpenAIAPI(prompt, apiKey);
    case 'anthropic':
      return callAnthropicAPI(prompt, apiKey);
    default:
      return callGeminiAPI(apiKey, prompt);
  }
}

/**
 * استدعاء واجهة برمجة تطبيقات Gemini (Google AI Studio)
 * هذه الدالة تدعم عدة عناوين URL للاتصال بواجهة برمجة تطبيقات Gemini.
 * إذا فشل الاتصال بأحد العناوين، ستحاول الاتصال بالعنوان التالي.
 * 
 * @param {string} apiKey - مفتاح API الخاص بواجهة Gemini
 * @param {string} prompt - النص الذي سيتم إرساله إلى الذكاء الاصطناعي
 * @returns {Promise<Object>} - وعد يحتوي على استجابة API
 */
async function callGeminiAPI(apiKey, prompt, customSettings = {}) {
  if (!apiKey) {
    return { error: "مفتاح API غير متوفر. يرجى إدخال مفتاح API الخاص بك في إعدادات الإضافة." };
  }
  
  // قائمة عناوين URL المحتملة للاتصال بواجهة برمجة تطبيقات Gemini
  const possibleEndpoints = [
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent"
  ];

  // تهيئة الإعدادات الافتراضية مع زيادة العشوائية
  const defaultSettings = {
    temperature: 0.7 + (Math.random() * 0.2), // 0.7-0.9 للحصول على تنوع أكبر
    maxOutputTokens: 2048,
    topK: 40,
    topP: 0.95
  };

  // دمج الإعدادات المخصصة مع الإعدادات الافتراضية
  const settings = { ...defaultSettings, ...customSettings };

  // إعداد بيانات الطلب
  const requestData = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: settings.temperature,
      maxOutputTokens: settings.maxOutputTokens,
      topK: settings.topK,
      topP: settings.topP
    }
  };

  // إعدادات الطلب
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestData)
  };

  // محاولة الاتصال بكل نقطة نهاية محتملة
  for (let i = 0; i < possibleEndpoints.length; i++) {
    const endpoint = possibleEndpoints[i];
    const urlWithKey = `${endpoint}?key=${apiKey}`;
    
    try {
      console.log(`محاولة الاتصال بـ ${endpoint}`);
      
      const response = await fetch(urlWithKey, requestOptions);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`نقطة النهاية غير موجودة: ${endpoint}. المحاولة مع نقطة نهاية بديلة...`);
          continue; // جرب نقطة النهاية التالية
        }

        const errorData = await response.json();
        return { 
          error: `خطأ API: ${errorData.error.message || 'خطأ غير معروف'}`,
          status: response.status 
        };
      }

      const data = await response.json();
      
      // تسجيل نجاح نقطة النهاية لاستخدامها في المستقبل
      chrome.runtime.sendMessage({ 
        action: "logSuccessfulEndpoint", 
        endpoint: endpoint 
      });
      
      // استخراج النص من الاستجابة
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const content = data.candidates[0].content;
        if (content.parts && content.parts[0] && content.parts[0].text) {
          return { text: content.parts[0].text };
        }
      }
      
      return { error: "تنسيق استجابة غير متوقع من واجهة برمجة التطبيقات" };
    } catch (error) {
      console.error(`فشل الاتصال بـ ${endpoint}:`, error);
      // استمر في المحاولة مع نقطة النهاية التالية
    }
  }

  // إذا وصلنا إلى هنا، فشلت جميع المحاولات
  return { error: "فشلت جميع محاولات الاتصال بواجهة برمجة تطبيقات Gemini. تحقق من اتصالك بالإنترنت ومفتاح API." };
}

// الاتصال بواجهة برمجة التطبيقات OpenAI (مستقبلاً)
async function callOpenAIAPI(prompt, apiKey) {
  // سيتم تنفيذ هذا لاحقاً 
  throw new Error('OpenAI غير مدعومة بعد');
}

// الاتصال بواجهة برمجة التطبيقات Anthropic Claude (مستقبلاً)
async function callAnthropicAPI(prompt, apiKey) {
  // سيتم تنفيذ هذا لاحقاً
  throw new Error('Anthropic Claude غير مدعومة بعد');
}

// الاستماع للرسائل من الخلفية
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // استقبال طلبات ملء الحقول
  if (message.action === 'fillAllInputs') {
    fillAllInputs(message.apiKey, message.settings)
      .then(count => sendResponse({ success: true, count }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // الإشارة إلى استخدام sendResponse غير متزامن
  }
  
  // استقبال طلبات ملء نموذج معين
  if (message.action === 'fillForm') {
    const element = document.activeElement || document.body;
    fillForm(element, message.apiKey, message.settings)
      .then(count => sendResponse({ success: true, count }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  // استقبال طلبات ملء حقل واحد
  if (message.action === 'fillInput') {
    const element = document.activeElement;
    if (!element || (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA' && !element.isContentEditable)) {
      sendResponse({ success: false, error: getNotificationText('status.noActiveField') });
      return true;
    }
    
    fillSingleInput(element, message.apiKey, message.settings)
      .then(success => sendResponse({ success }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  // تحديث الإعدادات
  if (message.action === 'updateSettings') {
    currentSettings = { ...currentSettings, ...message.settings };
    console.log('تم تحديث الإعدادات:', currentSettings);
    
    // إذا تم تغيير اللغة، يمكننا تحديث أي عناصر في الصفحة تستخدم الترجمة
    if (message.settings.language && notificationElement) {
      hideNotification(); // إخفاء أي إشعارات حالية
    }
    
    sendResponse({ success: true });
    return false;
  }
  
  // تغيير اللغة
  if (message.action === 'languageChanged') {
    currentSettings.language = message.language;
    console.log('تم تغيير اللغة إلى:', message.language);
    
    // تحديث أي إشعارات نشطة
    if (notificationElement && notificationElement.classList.contains('show')) {
      hideNotification(); // إخفاء الإشعار الحالي
    }
    
    // إعادة تحميل وحدة الترجمات
    if (translationsModule && translationsModule.clearCache) {
      translationsModule.clearCache();
    }
    
    sendResponse({ success: true });
    return false;
  }
  
  // إعادة تهيئة الإشعارات
  if (message.action === 'resetNotifications') {
    if (notificationElement) {
      // إزالة عنصر الإشعار الحالي
      notificationElement.remove();
      notificationElement = null;
    }
    sendResponse({ success: true });
    return false;
  }
  
  return false;
});

// إضافة معالج للأخطاء غير المعالجة
window.addEventListener('error', function(event) {
  console.error('خطأ غير معالج في content script:', event.error);
  event.preventDefault(); // منع انتشار الخطأ
});

// معالج الوعود غير المعالجة
window.addEventListener('unhandledrejection', function(event) {
  // التحقق من نوع الخطأ وتجنب طباعة أخطاء الاتصال الشائعة
  const errorMsg = event.reason?.message || String(event.reason);
  if (errorMsg.includes('Could not establish connection') || 
      errorMsg.includes('Receiving end does not exist') ||
      errorMsg.includes('The message port closed') ||
      errorMsg.includes('message channel closed')) {
    // تجاهل أخطاء إغلاق الاتصال الشائعة
    console.warn('تم تجاهل خطأ اتصال شائع:', errorMsg);
  } else {
    // تسجيل الأخطاء الأخرى
    console.error('وعد غير معالج في content script:', errorMsg);
  }
  
  // منع انتشار الخطأ
  event.preventDefault();
});

/**
 * يقوم بتحليل حقل الإدخال وتحديد القيمة المناسبة له بناءً على خصائصه
 * @param {HTMLElement} input - عنصر الإدخال المراد تحليله
 * @returns {string} القيمة المقترحة للإدخال
 */
function generateSmartSuggestion(input) {
  // الحصول على النص المرتبط بالحقل (من العنوان أو النص البديل أو الاسم)
  const labelText = getAssociatedLabelText(input).toLowerCase();
  const placeholder = (input.placeholder || "").toLowerCase();
  const name = (input.name || "").toLowerCase();
  const id = (input.id || "").toLowerCase();
  const type = (input.type || "").toLowerCase();
  const autocomplete = (input.getAttribute("autocomplete") || "").toLowerCase();
  const pattern = input.pattern;
  const maxLength = input.maxLength > 0 ? input.maxLength : 100;
  
  // الكلمات المفتاحية للفئات المختلفة
  const keywordMap = {
    name: ['name', 'fullname', 'full-name', 'full_name', 'first-name', 'firstname', 'first_name', 'اسم', 'الاسم', 'اسم كامل', 'الاسم الكامل'],
    firstName: ['first-name', 'firstname', 'first_name', 'fname', 'first', 'الاسم الأول', 'اسم أول'],
    lastName: ['last-name', 'lastname', 'last_name', 'lname', 'last', 'family', 'surname', 'اسم العائلة', 'اللقب', 'الاسم الأخير'],
    email: ['email', 'e-mail', 'mail', 'بريد', 'ايميل', 'البريد الإلكتروني', 'بريد إلكتروني'],
    phone: ['phone', 'mobile', 'cell', 'telephone', 'tel', 'هاتف', 'جوال', 'موبايل', 'رقم الهاتف', 'رقم الجوال'],
    password: ['password', 'pwd', 'pass', 'كلمة المرور', 'كلمة السر', 'كلمة مرور', 'باسوورد'],
    confirmPassword: ['confirm', 'repeat', 'verify', 'retype', 'تأكيد', 'أعد كتابة', 'تأكيد كلمة المرور', 'إعادة كلمة المرور'],
    address: ['address', 'street', 'location', 'العنوان', 'الشارع', 'عنوان'],
    city: ['city', 'town', 'المدينة', 'مدينة'],
    country: ['country', 'nation', 'الدولة', 'البلد', 'دولة', 'بلد'],
    zipCode: ['zip', 'postal', 'postcode', 'zip-code', 'zip_code', 'الرمز البريدي', 'رمز بريدي'],
    state: ['state', 'province', 'region', 'المحافظة', 'الولاية', 'المنطقة'],
    birthDate: ['birth', 'birthday', 'dob', 'date of birth', 'تاريخ الميلاد', 'تاريخ ميلاد'],
    age: ['age', 'years', 'العمر', 'سن'],
    username: ['username', 'user-name', 'user_name', 'user', 'login', 'اسم المستخدم', 'يوزر'],
    website: ['website', 'site', 'url', 'web', 'domain', 'موقع', 'موقع إلكتروني', 'رابط'],
    company: ['company', 'organization', 'business', 'employer', 'شركة', 'مؤسسة', 'منظمة', 'العمل'],
    search: ['search', 'find', 'query', 'look', 'بحث', 'ابحث'],
    comment: ['comment', 'review', 'feedback', 'message', 'تعليق', 'رسالة', 'ملاحظات'],
    quantity: ['quantity', 'qty', 'amount', 'number', 'count', 'كمية', 'عدد'],
    price: ['price', 'cost', 'amount', 'السعر', 'التكلفة', 'ثمن'],
    creditCard: ['credit-card', 'credit_card', 'creditcard', 'card-number', 'card_number', 'cardnumber', 'بطاقة ائتمان', 'رقم البطاقة'],
    cvv: ['cvv', 'cvc', 'security-code', 'security_code', 'securitycode', 'رمز الأمان', 'الرمز الأمني'],
    expiryDate: ['expiry', 'expiration', 'exp-date', 'exp_date', 'expdate', 'تاريخ الانتهاء', 'تاريخ انتهاء الصلاحية'],
    cardHolder: ['card-holder', 'card_holder', 'cardholder', 'name-on-card', 'name_on_card', 'nameoncard', 'اسم حامل البطاقة', 'الاسم على البطاقة']
  };
  
  // وظيفة مساعدة لفحص ما إذا كانت الكلمات المفتاحية موجودة في النص
  function containsKeyword(text, keywords) {
    return keywords.some(keyword => 
      text.includes(keyword) || 
      (text.replace(/[^a-zA-Z0-9]/g, "").includes(keyword.replace(/[^a-zA-Z0-9]/g, "")))
    );
  }
  
  function checkFields(keywords) {
    return (
      containsKeyword(labelText, keywords) || 
      containsKeyword(placeholder, keywords) || 
      containsKeyword(name, keywords) || 
      containsKeyword(id, keywords) ||
      containsKeyword(autocomplete, keywords)
    );
  }
  
  // تحديد نوع الحقل بناءً على الخصائص
  let fieldType = null;
  
  // تحديد النوع بناءً على نوع HTML
  if (type === 'email') {
    fieldType = 'email';
  } else if (type === 'tel') {
    fieldType = 'phone';
  } else if (type === 'password') {
    fieldType = 'password';
  } else if (type === 'search') {
    fieldType = 'search';
  } else if (type === 'number') {
    if (checkFields(keywordMap.age)) {
      fieldType = 'age';
    } else if (checkFields(keywordMap.quantity)) {
      fieldType = 'quantity';
    } else if (checkFields(keywordMap.price)) {
      fieldType = 'price';
    } else {
      fieldType = 'number';
    }
  } else if (type === 'date') {
    if (checkFields(keywordMap.birthDate)) {
      fieldType = 'birthDate';
    } else if (checkFields(keywordMap.expiryDate)) {
      fieldType = 'expiryDate';
    } else {
      fieldType = 'date';
    }
  } else if (type === 'url') {
    fieldType = 'website';
  } else if (type === 'textarea' || input.tagName === 'TEXTAREA') {
    fieldType = 'comment';
  }
  
  // إذا لم يتم تحديد النوع بواسطة HTML، استخدم الكلمات المفتاحية
  if (!fieldType) {
    for (const [type, keywords] of Object.entries(keywordMap)) {
      if (checkFields(keywords)) {
        fieldType = type;
        break;
      }
    }
  }
  
  // تحقق من حالة تأكيد كلمة المرور
  if (fieldType === 'password' && checkFields(keywordMap.confirmPassword)) {
    fieldType = 'confirmPassword';
  }
  
  // إذا لم يتم تحديد النوع، استخدم الإدخال النصي العام
  if (!fieldType) {
    fieldType = 'text';
  }
  
  // إنشاء قيمة بناءً على نوع الحقل
  switch (fieldType) {
    case 'name':
      return 'محمد أحمد';
    case 'firstName':
      return 'محمد';
    case 'lastName':
      return 'أحمد';
    case 'email':
      return 'test@example.com';
    case 'phone':
      return '+9665XXXXXXXX';
    case 'password':
      return 'Test@12345';
    case 'confirmPassword':
      return 'Test@12345';
    case 'address':
      return 'شارع الملك فهد';
    case 'city':
      return 'الرياض';
    case 'country':
      return 'المملكة العربية السعودية';
    case 'zipCode':
      return '12345';
    case 'state':
      return 'الرياض';
    case 'birthDate':
      // تاريخ ميلاد عشوائي للشخص 25-40 سنة
      const today = new Date();
      const year = today.getFullYear() - 25 - Math.floor(Math.random() * 15);
      const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
      const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
      if (type === 'date') {
        return `${year}-${month}-${day}`;
      } else {
        return `${day}/${month}/${year}`;
      }
    case 'age':
      return String(25 + Math.floor(Math.random() * 15));
    case 'username':
      return 'user_' + Math.floor(Math.random() * 10000);
    case 'website':
      return 'https://www.example.com';
    case 'company':
      return 'شركة التقنية المتطورة';
    case 'search':
      return 'نتائج البحث';
    case 'comment':
      return 'هذا تعليق تجريبي لاختبار النظام. شكراً لكم!';
    case 'quantity':
      return '1';
    case 'price':
      return '99.99';
    case 'creditCard':
      return '4111 1111 1111 1111';
    case 'cvv':
      return '123';
    case 'expiryDate':
      const nextYear = today.getFullYear() + 1;
      const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
      if (type === 'date') {
        return `${nextYear}-${currentMonth}-01`;
      } else {
        return `${currentMonth}/${String(nextYear).slice(2)}`;
      }
    case 'cardHolder':
      return 'محمد أحمد';
    case 'number':
      return '42';
    case 'date':
      const dateObj = new Date();
      const dateYear = dateObj.getFullYear();
      const dateMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dateDay = String(dateObj.getDate()).padStart(2, '0');
      return `${dateYear}-${dateMonth}-${dateDay}`;
    case 'text':
    default:
      // تعامل خاص مع الحقول ذات طول صغير
      if (maxLength <= 5) {
        return 'ABC';
      } else {
        return 'نص تجريبي';
      }
  }
}

// تحديث الدالة fillInput لاستخدام generateSmartSuggestion
function fillInput(input, settings) {
  // إذا كان الإدخال هو حقل نص وليس له قيمة بالفعل
  if (input && (input.value === '' || settings.overwriteExistingValues)) {
    // استخدام generateSmartSuggestion لتوليد قيمة ذكية
    const smartValue = generateSmartSuggestion(input);
    
    // تعيين القيمة
    input.value = smartValue;
    
    // إطلاق أحداث تغيير القيمة لضمان تفاعل التطبيق مع التغيير
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    
    // إضافة تأثير مرئي لحقول الإدخال التي تم ملؤها
    input.style.transition = 'background-color 0.3s ease';
    input.style.backgroundColor = '#e6ffe6';
    setTimeout(() => {
      input.style.backgroundColor = '';
    }, 1000);
    
    return true;
  }
  
  return false;
} 