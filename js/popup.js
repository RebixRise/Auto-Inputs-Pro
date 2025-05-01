document.addEventListener('DOMContentLoaded', () => {
  // تتبع ملف الترجمات
  console.log('هل ملف الترجمات متاح؟', window.translations ? 'نعم' : 'لا');
  if (window.translations) {
    console.log('لغات متاحة:', Object.keys(window.translations));
  } else {
    // محاولة تحميل ملف الترجمات يدويًا إذا لم يكن متاحًا بعد
    loadTranslationsModule();
  }
  
  // العناصر الأساسية
  const apiKeyInput = document.getElementById('apiKeyInput');
  const toggleViewBtn = document.getElementById('toggleView');
  const saveApiKeyBtn = document.getElementById('saveApiKey');
  const statusMessage = document.getElementById('statusMessage');
  const aiModelSelect = document.getElementById('aiModelSelect');
  
  // العناصر الإضافية
  const autoSubmitForms = document.getElementById('autoSubmitForms');
  const showNotificationsOnPage = document.getElementById('showNotificationsOnPage');
  const formFillDelay = document.getElementById('formFillDelay');
  const exportSettings = document.getElementById('exportSettings');
  const importSettings = document.getElementById('importSettings');
  const importSettingsFile = document.getElementById('importSettingsFile');
  
  // عناصر الوضع المظلم
  const themeToggle = document.getElementById('themeToggle');
  
  // عناصر دعم المواقع المتقدم
  const enableAdvancedSiteSupport = document.getElementById('enableAdvancedSiteSupport');
  const supportedSitesCheckboxes = document.querySelectorAll('input[name="supportedSites"]');
  
  // عناصر شاشة الترحيب
  const welcomeOverlay = document.getElementById('welcomeOverlay');
  const welcomeCloseBtn = document.getElementById('welcomeCloseBtn');
  const welcomeNextBtn = document.getElementById('welcomeNextBtn');
  const welcomePrevBtn = document.getElementById('welcomePrevBtn');
  const welcomeSteps = document.querySelectorAll('.welcome-step');
  const stepDots = document.querySelectorAll('.step-dot');
  
  // زر تبديل اللغة
  const languageToggle = document.getElementById('languageToggle');
  
  // إضافة معالج التبويب
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // إزالة الفئة النشطة من جميع الأزرار والمحتويات
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // إضافة الفئة النشطة للزر المحدد
      button.classList.add('active');
      
      // عرض المحتوى المقابل
      const tabId = button.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
      
      // إذا كان التبويب هو الإحصائيات، أعد رسم المخطط البياني
      if (tabId === 'stats' && window.statsManager) {
        setTimeout(() => {
          if (window.statsManager && typeof window.statsManager.updateChart === 'function') {
            window.statsManager.updateChart();
          }
        }, 100);
      }
    });
  });
  
  // الإعدادات الافتراضية
  const defaultSettings = {
    geminiApiKey: '',
    openaiApiKey: '',
    anthropicApiKey: '',
    selectedModel: 'gemini',
    autoSubmitForms: false,
    showNotificationsOnPage: true,
    formFillDelay: 100,
    language: 'ar',
    firstInstall: true,
    theme: 'light',
    enableAdvancedSiteSupport: false,
    supportedSites: []
  };
  
  // استعادة الإعدادات من التخزين
  loadSettings();
  
  // حفظ مفتاح API وإعدادات أخرى
  saveApiKeyBtn.addEventListener('click', saveSettings);
  
  // تبديل عرض/إخفاء مفتاح API
  toggleViewBtn.addEventListener('click', () => {
    const currentLang = document.documentElement.getAttribute('lang') || 'ar';
    const translations = window.translations || {};
    const t = translations[currentLang] || translations.ar || {};
    
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleViewBtn.innerHTML = t.ui?.hidePassword || '<i class="fa-solid fa-eye-slash"></i>';
    } else {
      apiKeyInput.type = 'password';
      toggleViewBtn.innerHTML = t.ui?.showPassword || '<i class="fa-solid fa-eye"></i>';
    }
  });
  
  // تحديث التلميح عند تغيير نموذج الذكاء الاصطناعي
  aiModelSelect.addEventListener('change', updateApiKeyPlaceholder);
  
  // استيراد وتصدير الإعدادات
  exportSettings.addEventListener('click', exportSettingsToFile);
  importSettings.addEventListener('click', () => importSettingsFile.click());
  importSettingsFile.addEventListener('change', importSettingsFromFile);
  
  // إدارة دعم المواقع المتقدم
  enableAdvancedSiteSupport.addEventListener('change', updateSiteSupport);
  supportedSitesCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', saveSupportedSites);
  });
  
  // إغلاق شاشة الترحيب
  welcomeCloseBtn.addEventListener('click', () => {
    welcomeOverlay.classList.remove('active');
    
    // حفظ إعداد عدم عرض الشاشة مرة أخرى
    chrome.storage.sync.get(defaultSettings, (result) => {
      const updatedSettings = { ...result, firstInstall: false };
      chrome.storage.sync.set(updatedSettings);
    });
  });
  
  // التنقل بين خطوات شاشة الترحيب
  welcomeNextBtn.addEventListener('click', () => {
    const activeStep = document.querySelector('.welcome-step.active');
    if (activeStep) {
      const currentStep = parseInt(activeStep.getAttribute('data-step'));
      
      if (currentStep < welcomeSteps.length) {
        // إخفاء الخطوة الحالية
        activeStep.classList.remove('active');
        
        // عرض الخطوة التالية
        const nextStep = document.querySelector(`.welcome-step[data-step="${currentStep + 1}"]`);
        if (nextStep) {
          nextStep.classList.add('active');
          
          // تحديث النقاط
          updateStepDots(currentStep + 1);
          
          // تحديث أزرار التنقل
          welcomePrevBtn.disabled = false;
          
          if (currentStep + 1 === welcomeSteps.length) {
            // إذا كانت الخطوة الأخيرة
            welcomeNextBtn.style.display = 'none';
            welcomeCloseBtn.style.display = 'inline-block';
          }
        }
      }
    }
  });
  
  welcomePrevBtn.addEventListener('click', () => {
    const activeStep = document.querySelector('.welcome-step.active');
    if (activeStep) {
      const currentStep = parseInt(activeStep.getAttribute('data-step'));
      
      if (currentStep > 1) {
        // إخفاء الخطوة الحالية
        activeStep.classList.remove('active');
        
        // عرض الخطوة السابقة
        const prevStep = document.querySelector(`.welcome-step[data-step="${currentStep - 1}"]`);
        if (prevStep) {
          prevStep.classList.add('active');
          
          // تحديث النقاط
          updateStepDots(currentStep - 1);
          
          // تحديث أزرار التنقل
          welcomeNextBtn.style.display = 'inline-block';
          welcomeCloseBtn.style.display = 'none';
          
          if (currentStep - 1 === 1) {
            welcomePrevBtn.disabled = true;
          }
        }
      }
    }
  });
  
  // تحديث نقاط الخطوات في شاشة الترحيب
  function updateStepDots(activeStep) {
    stepDots.forEach(dot => {
      const step = parseInt(dot.getAttribute('data-step'));
      if (step === activeStep) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }
  
  // تبديل اللغة
  languageToggle.addEventListener('click', toggleLanguage);
  
  // تبديل الوضع المظلم/الفاتح
  themeToggle.addEventListener('click', toggleTheme);
  
  // الاستماع لحدث اكتمال تحميل الترجمات
  window.addEventListener('translationsReady', () => {
    console.log('تم استلام حدث اكتمال تحميل الترجمات');
    loadSettings();
  });
  
  // استماع لتغييرات وضع النظام (dark/light)
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  darkModeMediaQuery.addEventListener('change', (e) => {
    chrome.storage.sync.get(defaultSettings, (result) => {
      if (result.theme === 'auto') {
        applyTheme('auto');
      }
    });
  });
  
  // استرجاع الإعدادات
  function loadSettings() {
    chrome.storage.sync.get(defaultSettings, (result) => {
      // تحديث واجهة المستخدم بالإعدادات المحفوظة
      aiModelSelect.value = result.selectedModel;
      updateApiKeyPlaceholder();
      
      // اختيار مفتاح API المناسب بناءً على النموذج المحدد
      switch(result.selectedModel) {
        case 'gemini':
          apiKeyInput.value = result.geminiApiKey;
          break;
        case 'openai':
          apiKeyInput.value = result.openaiApiKey;
          break;
        case 'anthropic':
          apiKeyInput.value = result.anthropicApiKey;
          break;
      }
      
      // تحديث الإعدادات الأخرى
      autoSubmitForms.checked = result.autoSubmitForms;
      showNotificationsOnPage.checked = result.showNotificationsOnPage;
      formFillDelay.value = result.formFillDelay;
      
      // تحديث إعدادات دعم المواقع المتقدم
      enableAdvancedSiteSupport.checked = result.enableAdvancedSiteSupport || false;
      updateSiteSupportVisibility();
      
      if (result.supportedSites && result.supportedSites.length > 0) {
        supportedSitesCheckboxes.forEach(checkbox => {
          checkbox.checked = result.supportedSites.includes(checkbox.value);
        });
      }
      
      // تحديث الثيم
      applyTheme(result.theme || 'auto');
      
      // تحديث اللغة
      updateLanguageUI(result.language || 'ar');
      
      // عرض شاشة الترحيب للمستخدمين الجدد
      if (result.firstInstall) {
        setTimeout(() => {
          welcomeOverlay.classList.add('active');
        }, 500);
      }
      
      if (apiKeyInput.value) {
        const translations = window.translations || {};
        const lang = result.language || 'ar';
        const t = translations[lang] || translations.ar || {};
        const successMessage = t.status?.settingsLoaded || 'تم استعادة الإعدادات بنجاح';
        
        showStatusMessage(successMessage, 'success');
      }
    });
  }
  
  // تحديث نص التلميح لحقل مفتاح API
  function updateApiKeyPlaceholder() {
    const model = aiModelSelect.value;
    const currentLang = document.documentElement.getAttribute('lang') || 'ar';
    const translations = window.translations || {};
    const t = translations[currentLang] || translations.ar || {};
    
    // استخدام الترجمات الخاصة بالنموذج إذا كانت موجودة
    if (t.ui?.modelPlaceholders && t.ui.modelPlaceholders[model]) {
      apiKeyInput.placeholder = t.ui.modelPlaceholders[model];
    } 
    // استخدام النص العام للـ placeholder
    else if (t.apiSettings?.apiKeyPlaceholder) {
      apiKeyInput.placeholder = t.apiSettings.apiKeyPlaceholder;
    } 
    // استخدام نصوص احتياطية
    else {
      switch(model) {
        case 'gemini':
          apiKeyInput.placeholder = currentLang === 'ar' ? 
            'أدخل مفتاح API الخاص بك من Google Gemini' : 
            'Enter your API key from Google Gemini';
          break;
        case 'openai':
          apiKeyInput.placeholder = currentLang === 'ar' ? 
            'أدخل مفتاح API الخاص بك من OpenAI' : 
            'Enter your API key from OpenAI';
          break;
        case 'anthropic':
          apiKeyInput.placeholder = currentLang === 'ar' ? 
            'أدخل مفتاح API الخاص بك من Anthropic Claude' : 
            'Enter your API key from Anthropic Claude';
          break;
      }
    }
  }
  
  // حفظ الإعدادات
  function saveSettings() {
    const apiKey = apiKeyInput.value.trim();
    const selectedModel = aiModelSelect.value;
    const currentLang = document.documentElement.getAttribute('lang') || 'ar';
    const translations = window.translations || {};
    const t = translations[currentLang] || translations.ar || {};
    
    if (!apiKey) {
      const errorMessage = t.status?.enterApiKey || 'يرجى إدخال مفتاح API الخاص بك';
      showStatusMessage(errorMessage, 'error');
      return;
    }
    
    // إضافة مؤشر التحميل
    const saveBtn = saveApiKeyBtn;
    saveBtn.classList.add('loading');
    
    // تحقق من صلاحية المفتاح (تنسيق بسيط)
    if (!isValidApiKeyFormat(apiKey)) {
      const errorMessage = t.status?.invalidApiKey || 'يبدو أن تنسيق مفتاح API غير صحيح';
      showStatusMessage(errorMessage, 'error');
      saveBtn.classList.remove('loading');
      return;
    }
    
    // إنشاء كائن الإعدادات
    let settings = {
      selectedModel,
      autoSubmitForms: autoSubmitForms.checked,
      showNotificationsOnPage: showNotificationsOnPage.checked,
      formFillDelay: parseInt(formFillDelay.value, 10) || 100,
      enableAdvancedSiteSupport: enableAdvancedSiteSupport.checked,
      supportedSites: Array.from(supportedSitesCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value)
    };
    
    // تخزين مفتاح API في الحقل المناسب
    switch(selectedModel) {
      case 'gemini':
        settings.geminiApiKey = apiKey;
        break;
      case 'openai':
        settings.openaiApiKey = apiKey;
        break;
      case 'anthropic':
        settings.anthropicApiKey = apiKey;
        break;
    }
    
    // حفظ الإعدادات
    chrome.storage.sync.get(defaultSettings, (existingSettings) => {
      // دمج الإعدادات الجديدة مع القديمة
      const mergedSettings = { ...existingSettings, ...settings };
      
      setTimeout(() => {
        chrome.storage.sync.set(mergedSettings, () => {
          saveBtn.classList.remove('loading');
          const successMessage = t.status?.settingsSaved || 'تم حفظ الإعدادات بنجاح!';
          showStatusMessage(successMessage, 'success');
          
          // إعلام العمليات الخلفية بتحديث الإعدادات
          sendMessageWithResponse({ 
            action: 'settingsUpdated', 
            settings: mergedSettings 
          });
        });
      }, 800); // تأخير مصطنع لإظهار التحميل
    });
  }
  
  // تحديث ظهور خيارات دعم المواقع
  function updateSiteSupport() {
    updateSiteSupportVisibility();
    saveSupportedSites();
  }
  
  // تحديث ظهور خيارات المواقع المدعومة
  function updateSiteSupportVisibility() {
    const siteOptions = document.querySelector('.site-support-options');
    if (siteOptions) {
      if (enableAdvancedSiteSupport.checked) {
        siteOptions.style.display = 'grid';
      } else {
        siteOptions.style.display = 'none';
      }
    }
  }
  
  // حفظ المواقع المدعومة
  function saveSupportedSites() {
    chrome.storage.sync.get(defaultSettings, (result) => {
      const supportedSites = Array.from(supportedSitesCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
      
      const updatedSettings = {
        ...result,
        enableAdvancedSiteSupport: enableAdvancedSiteSupport.checked,
        supportedSites
      };
      
      chrome.storage.sync.set(updatedSettings, () => {
        // إعلام العمليات الخلفية بتحديث الإعدادات
        sendMessageWithResponse({ 
          action: 'settingsUpdated', 
          settings: updatedSettings 
        });
      });
    });
  }
  
  // تبديل الوضع المظلم/الفاتح
  function toggleTheme() {
    chrome.storage.sync.get(defaultSettings, (result) => {
      let newTheme;
      const currentTheme = result.theme || 'auto';
      
      // تبديل مباشر بين الوضع المظلم والفاتح
      if (currentTheme === 'dark' || (currentTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        newTheme = 'light';
      } else {
        newTheme = 'dark';
      }
      
      // حفظ الوضع الجديد
      const updatedSettings = { ...result, theme: newTheme };
      chrome.storage.sync.set(updatedSettings, () => {
        // تطبيق التغييرات
        applyTheme(newTheme);
      });
    });
  }
  
  // تطبيق الوضع المظلم/الفاتح
  function applyTheme(theme) {
    // إزالة السمات القديمة
    document.documentElement.removeAttribute('data-theme');
    
    // إضافة السمة الجديدة
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else if (theme === 'auto') {
      // وضع تلقائي - اتبع تفضيلات المتصفح
      themeToggle.innerHTML = '<i class="fa-solid fa-circle-half-stroke"></i>';
      
      // استخدام متغير CSS لمعرفة ما إذا كان المستخدم يفضل الوضع المظلم
      const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDarkScheme) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    }
    
    // إعادة رسم المخطط البياني إذا كان موجودًا
    if (window.statsManager && typeof window.statsManager.handleThemeChange === 'function') {
      window.statsManager.handleThemeChange();
    }
  }
  
  // تصدير الإعدادات إلى ملف
  function exportSettingsToFile() {
    chrome.storage.sync.get(null, (settings) => {
      // إزالة أي معلومات حساسة لا ترغب في تصديرها (اختياري)
      // const exportableSettings = { ...settings };
      // delete exportableSettings.sensitiveData;
      
      const dataStr = JSON.stringify(settings, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = 'auto-inputs-pro-settings.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      const currentLang = document.documentElement.getAttribute('lang') || 'ar';
      const translations = window.translations || {};
      const t = translations[currentLang] || translations.ar || {};
      const successMessage = t.status?.exportSuccess || 'تم تصدير الإعدادات بنجاح!';
      
      showStatusMessage(successMessage, 'success');
    });
  }
  
  // استيراد الإعدادات من ملف
  function importSettingsFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const currentLang = document.documentElement.getAttribute('lang') || 'ar';
    const translations = window.translations || {};
    const t = translations[currentLang] || translations.ar || {};
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const settings = JSON.parse(e.target.result);
        
        // التحقق من بعض الإعدادات الأساسية للتأكد من أن الملف صالح
        if (settings && typeof settings === 'object') {
          chrome.storage.sync.set(settings, () => {
            const successMessage = t.status?.importSuccess || 'تم استيراد الإعدادات بنجاح!';
            showStatusMessage(successMessage, 'success');
            loadSettings(); // إعادة تحميل الإعدادات لتحديث واجهة المستخدم
            
            // إعلام العمليات الخلفية بتحديث الإعدادات
            sendMessageWithResponse({ 
              action: 'settingsUpdated', 
              settings 
            });
          });
        } else {
          const errorMessage = t.status?.invalidFile || 'الملف ليس في التنسيق الصحيح';
          showStatusMessage(errorMessage, 'error');
        }
      } catch (error) {
        console.error('خطأ في تحليل ملف الإعدادات:', error);
        const errorMessage = t.status?.importError || 'حدث خطأ أثناء استيراد الإعدادات';
        showStatusMessage(errorMessage, 'error');
      }
    };
    reader.readAsText(file);
    
    // إعادة تعيين حقل الملف للسماح باختيار نفس الملف مرة أخرى
    event.target.value = '';
  }
  
  // تحقق من صحة تنسيق مفتاح API (تحقق بسيط)
  function isValidApiKeyFormat(key) {
    // للمفاتيح الخاصة بـ Gemini
    if (aiModelSelect.value === 'gemini') {
      return key.length >= 20 && /^[A-Za-z0-9\-_]+$/.test(key);
    }
    
    // يمكن إضافة تحققات خاصة للنماذج الأخرى
    
    // تحقق عام
    return key.length >= 8;
  }
  
  // عرض رسالة الحالة
  function showStatusMessage(message, type) {
    if (!statusMessage) return;
    
    // مسح أي مؤقتات سابقة
    if (window.statusMessageTimeout) {
      clearTimeout(window.statusMessageTimeout);
    }
    
    // إعادة تعيين الفئات والتأثيرات
    statusMessage.className = '';
    
    // إظهار العنصر وضبط المحتوى
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    
    // إخفاء الرسالة بعد 3 ثوانٍ
    window.statusMessageTimeout = setTimeout(() => {
      // إضافة فئة التلاشي قبل الإخفاء
      statusMessage.classList.add('fade-out');
      
      // إزالة الرسالة بعد انتهاء التأثير
      setTimeout(() => {
        statusMessage.className = 'status-message';
        statusMessage.textContent = '';
      }, 300);
    }, 3000);
  }
  
  // أرسل رسالة وانتظر رد بشكل متزامن
  function sendMessageWithResponse(message) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          const lastError = chrome.runtime.lastError;
          if (lastError) {
            console.warn('خطأ عند إرسال رسالة:', lastError.message);
            resolve({ success: false, error: lastError.message });
          } else {
            resolve(response || { success: true });
          }
        });
      } catch (error) {
        console.error('خطأ في إرسال الرسالة:', error);
        resolve({ success: false, error: error.message });
      }
    });
  }
  
  // تبديل اللغة
  function toggleLanguage() {
    chrome.storage.sync.get(defaultSettings, (result) => {
      // تغيير اللغة
      const currentLang = result.language || 'ar';
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      
      console.log('تغيير اللغة من', currentLang, 'إلى', newLang);
      
      // تحديث الإعدادات
      const updatedSettings = { ...result, language: newLang };
      chrome.storage.sync.set(updatedSettings, () => {
        console.log('تم حفظ اللغة الجديدة:', newLang);
        
        // تطبيق التغييرات على واجهة المستخدم
        document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', newLang);
        
        // إرسال حدث مخصص لإعلام المكونات الأخرى بتغيير اللغة
        const event = new CustomEvent('languageChanged', { 
          detail: { language: newLang },
          bubbles: true 
        });
        document.dispatchEvent(event);
        
        // إعلام المكونات الأخرى بتغيير اللغة
        sendMessageWithResponse({ 
          action: 'languageChanged', 
          language: newLang 
        });
        
        // تحديث واجهة المستخدم
        updateLanguageUI(newLang);
        
        // تحديث إحصائيات المخطط البياني إذا كان متاحاً
        if (window.statsManager && typeof window.statsManager.updateLanguage === 'function') {
          window.statsManager.updateLanguage(newLang);
        }
      });
    });
  }
  
  // تحديث واجهة المستخدم حسب اللغة
  function updateLanguageUI(lang) {
    // استيراد ملف الترجمات
    const translations = window.translations || {};
    
    if (!translations || !translations[lang]) {
      console.error(`الترجمات غير متوفرة للغة: ${lang}`);
      return;
    }
    
    // ضبط اتجاه المستند
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
    
    // تحديث نص زر تبديل اللغة
    const langText = document.querySelector('#languageToggle .lang-text');
    if (langText) {
      langText.textContent = lang === 'ar' ? 'EN' : 'عربي';
    } else {
      languageToggle.innerHTML = lang === 'ar' ? 
        '<i class="fa-solid fa-globe"></i> <span class="lang-text">EN</span>' : 
        '<i class="fa-solid fa-globe"></i> <span class="lang-text">عربي</span>';
    }

    // تحديث جميع العناصر المترجمة باستخدام سمة data-key
    updateTranslatedElements(lang);
    
    // تحديث العناصر التي تحتاج إلى معالجة خاصة
    updateElementsWithSpecialHandling(lang);
  }

  /**
   * تحديث جميع العناصر المترجمة في الصفحة
   * @param {string} lang - لغة الترجمة
   */
  function updateTranslatedElements(lang) {
    const translations = window.translations || {};
    const t = translations[lang] || {};
    
    // تحديث العناصر مع فئة 'translated'
    document.querySelectorAll('.translated').forEach(element => {
      const key = element.getAttribute('data-key');
      if (key) {
        // استخدام دالة getTranslation للحصول على النص المترجم
        const translatedText = window.getTranslation ? 
          window.getTranslation(lang, key) : 
          getNestedTranslation(t, key);
          
        if (translatedText && translatedText !== key) {
          element.textContent = translatedText;
        }
      }
    });
    
    // تحديث السمات المترجمة (مثل placeholder)
    document.querySelectorAll('.translated-attr').forEach(element => {
      const key = element.getAttribute('data-key');
      const attr = element.getAttribute('data-attr');
      if (key && attr) {
        // استخدام دالة getTranslation للحصول على النص المترجم
        const translatedText = window.getTranslation ? 
          window.getTranslation(lang, key) : 
          getNestedTranslation(t, key);
          
        if (translatedText && translatedText !== key) {
          element.setAttribute(attr, translatedText);
        }
      }
    });
  }

  /**
   * الحصول على ترجمة من كائن متداخل باستخدام مفتاح مسار "a.b.c"
   * @param {Object} obj - كائن الترجمات
   * @param {string} path - مسار المفتاح
   * @returns {string|undefined} - النص المترجم أو undefined
   */
  function getNestedTranslation(obj, path) {
    return path.split('.').reduce((o, i) => o ? o[i] : undefined, obj);
  }

  /**
   * تحديث العناصر التي تحتاج إلى معالجة خاصة
   * @param {string} lang - لغة الترجمة
   */
  function updateElementsWithSpecialHandling(lang) {
    const translations = window.translations || {};
    const t = translations[lang] || {};
    
    // تحديث زر عرض/إخفاء كلمة المرور
    if (apiKeyInput.type === 'password') {
      toggleViewBtn.innerHTML = t.ui?.showPassword || '<i class="fa-solid fa-eye"></i>';
    } else {
      toggleViewBtn.innerHTML = t.ui?.hidePassword || '<i class="fa-solid fa-eye-slash"></i>';
    }
    
    // تحديث placeholder لحقل API
    updateApiKeyPlaceholder();
  }
  
  // فحص حالة المتصفح والامتداد
  setTimeout(() => {
    sendMessageWithResponse({ action: 'checkStatus' }).then(response => {
      if (response && response.active) {
        console.log('الامتداد يعمل بشكل صحيح');
      }
    });
  }, 500);

  // تهيئة علامات التبويب
  initTabs();

  /**
   * تحميل وحدة الترجمات يدويًا إذا لم تكن متاحة
   */
  function loadTranslationsModule() {
    console.log('محاولة تحميل ملف الترجمات يدويًا...');
    
    // إنشاء عنصر script جديد
    const script = document.createElement('script');
    script.src = 'js/translations.js';
    script.onload = function() {
      console.log('تم تحميل ملف الترجمات بنجاح!', window.translations ? 'متاح الآن' : 'غير متاح');
      // إعادة تحميل الإعدادات بعد تحميل ملف الترجمات
      if (window.translations) {
        loadSettings();
      }
    };
    script.onerror = function() {
      console.error('فشل في تحميل ملف الترجمات!');
    };
    
    // إضافة العنصر إلى الصفحة
    document.head.appendChild(script);
  }

  /**
   * تحديث جميع النصوص في الواجهة - دالة مفيدة لإعادة تحميل الترجمات بعد تغيير اللغة
   */
  function reloadAllTranslatedElements() {
    // الحصول على اللغة الحالية
    const currentLang = document.documentElement.getAttribute('lang') || 'ar';
    console.log('إعادة تحميل جميع العناصر المترجمة باللغة:', currentLang);
    
    // تحديث واجهة المستخدم بالترجمات الجديدة
    updateLanguageUI(currentLang);
  }
});

// وظيفة تهيئة علامات التبويب
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // تنشيط التبويب الأول افتراضيًا
  if (tabButtons.length > 0 && tabContents.length > 0) {
    tabButtons[0].classList.add('active');
    tabContents[0].classList.add('active');
  }

  // إضافة استماع لأحداث النقر على أزرار التبويب
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // إزالة الصنف النشط من جميع الأزرار والمحتويات
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // إضافة الصنف النشط للزر الذي تم النقر عليه
      button.classList.add('active');

      // العثور على محتوى التبويب المرتبط وتنشيطه
      const tabId = button.getAttribute('data-tab');
      const activeContent = document.getElementById(tabId);
      if (activeContent) {
        activeContent.classList.add('active');
      }
    });
  });
} 