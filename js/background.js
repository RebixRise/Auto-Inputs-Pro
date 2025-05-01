// إعداد القائمة السياقية (context menu)
let settings = {
  geminiApiKey: null,
  openaiApiKey: null,
  anthropicApiKey: null,
  selectedModel: 'gemini',
  autoSubmitForms: false,
  showNotificationsOnPage: true,
  formFillDelay: 100
};

// استرجاع الإعدادات عند بدء التشغيل
chrome.storage.sync.get(settings, (result) => {
  settings = { ...settings, ...result };
  console.log('تم استرجاع الإعدادات بنجاح');
});

// إنشاء عناصر القائمة السياقية
function createContextMenus() {
  // حذف العناصر الموجودة لتجنب التكرار
  chrome.contextMenus.removeAll(() => {
    // قائمة رئيسية للامتداد
    chrome.contextMenus.create({
      id: 'auto-inputs-pro',
      title: 'Auto-Inputs-Pro',
      contexts: ['editable']
    });

    // العناصر الفرعية
    chrome.contextMenus.create({
      id: 'fill-all-inputs',
      parentId: 'auto-inputs-pro',
      title: 'Fill All Inputs',
      contexts: ['editable']
    });

    chrome.contextMenus.create({
      id: 'fill-form',
      parentId: 'auto-inputs-pro',
      title: 'Fill this Form',
      contexts: ['editable']
    });

    chrome.contextMenus.create({
      id: 'fill-input',
      parentId: 'auto-inputs-pro',
      title: 'Fill This Input',
      contexts: ['editable']
    });

    // إضافة خيار ملء جميع الحقول في القائمة العامة (خارج الحقول)
    chrome.contextMenus.create({
      id: 'fill-all-page',
      title: 'Fill All Inputs',
      contexts: ['page']
    });
  });
}

// إنشاء القوائم عند تثبيت الامتداد
chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
});

// الحصول على مفتاح API النشط بناءً على النموذج المحدد
function getActiveApiKey() {
  switch(settings.selectedModel) {
    case 'gemini':
      return settings.geminiApiKey;
    case 'openai':
      return settings.openaiApiKey;
    case 'anthropic':
      return settings.anthropicApiKey;
    default:
      return null;
  }
}

// التعامل مع النقر على عناصر القائمة
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const apiKey = getActiveApiKey();
  
  if (!apiKey) {
    // إذا لم يكن المفتاح موجودًا، أظهر رسالة تذكير
    chrome.tabs.sendMessage(tab.id, {
      action: 'showNotification',
      message: 'يرجى إضافة مفتاح API الخاص بك أولاً'
    });
    return;
  }

  // تحديد نوع العملية المطلوبة
  let action = '';
  
  switch (info.menuItemId) {
    case 'fill-all-inputs':
    case 'fill-all-page':
      action = 'fillAllInputs';
      break;
    case 'fill-form':
      action = 'fillForm';
      break;
    case 'fill-input':
      action = 'fillInput';
      break;
  }
  
  // إرسال رسالة إلى content script مع الإعدادات الكاملة
  chrome.tabs.sendMessage(tab.id, {
    action,
    apiKey,
    targetElementId: info.targetElementId,
    settings: {
      selectedModel: settings.selectedModel,
      autoSubmitForms: settings.autoSubmitForms,
      showNotificationsOnPage: settings.showNotificationsOnPage,
      formFillDelay: settings.formFillDelay
    }
  });
});

/**
 * معالجة الرسائل الواردة من صفحات الامتداد وصفحات المحتوى
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    console.log('استلام رسالة في الصفحة الخلفية:', message.action);
    
    // تحديث الإعدادات
    if (message.action === 'settingsUpdated' && message.settings) {
      settings = { ...settings, ...message.settings };
      console.log('تم تحديث الإعدادات');
      sendResponse({ success: true });
    }
    
    // التحقق من حالة الامتداد
    else if (message.action === 'checkStatus') {
      sendResponse({ 
        active: true, 
        hasApiKey: !!getActiveApiKey(),
        settings
      });
    }
    
    // معالجة تغيير اللغة
    else if (message.action === 'languageChanged') {
      console.log('تم تغيير اللغة إلى:', message.language);
      sendResponse({ success: true });
    }
    
    // عرض إشعار
    else if (message.action === 'showNotification') {
      if (typeof message.message === 'string') {
        // إنشاء إشعار في المتصفح
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'assets/icons/icon48.png',
          title: 'Auto-Inputs-Pro',
          message: message.message,
          priority: 0
        });
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'رسالة الإشعار غير صالحة' });
      }
    }
    
    // للتوافق مع الإصدارات القديمة - تحديث مفتاح API فقط
    else if (message.action === 'apiKeyUpdated' && message.apiKey) {
      settings.geminiApiKey = message.apiKey;
      settings.selectedModel = 'gemini';
      console.log('تم تحديث مفتاح API (طريقة قديمة)');
      sendResponse({ success: true });
    }
    
    // معالجة طلبات API Gemini من صفحة المحتوى (لتجاوز قيود CORS)
    else if (message.action === 'callGeminiAPI' && message.apiKey && message.data) {
      console.log('جاري تنفيذ طلب Gemini API من الصفحة الخلفية...');
      
      const apiKey = message.apiKey;
      const requestData = message.data;
      const apiUrl = message.endpoint || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
      
      fetch(`${apiUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`خطأ في الاستجابة: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        console.error('خطأ في طلب الصفحة الخلفية:', error);
        sendResponse({ success: false, error: error.message });
      });
      
      return true; // الاحتفاظ بالاتصال مفتوحًا للاستجابة غير المتزامنة
    }
    
    // لأي رسالة أخرى، ارسل استجابة افتراضية
    else {
      console.log('معالجة رسالة غير محددة:', message.action);
      sendResponse({ success: true, message: 'تم استلام الرسالة' });
    }
    
    return true; // احتفظ بالاتصال مفتوحًا لجميع الرسائل
  } catch (error) {
    console.error('حدث خطأ في معالج الرسائل:', error);
    sendResponse({ success: false, error: error.message });
    return true;
  }
});

// إضافة معالج عام للأخطاء غير المعالجة
self.addEventListener('error', function(event) {
  console.error('خطأ غير معالج:', event.error);
});

// تحسين معالج الوعود غير المعالجة
self.addEventListener('unhandledrejection', function(event) {
  // التحقق من نوع الخطأ وتجنب طباعة أخطاء الاتصال الشائعة
  const errorMsg = event.reason?.message || String(event.reason);
  if (errorMsg.includes('Could not establish connection') || 
      errorMsg.includes('Receiving end does not exist') ||
      errorMsg.includes('The message port closed')) {
    // تجاهل أخطاء إغلاق الاتصال الشائعة
    console.warn('تم تجاهل خطأ اتصال شائع:', errorMsg);
  } else {
    // تسجيل الأخطاء الأخرى
    console.error('وعد غير معالج:', errorMsg);
  }
  
  // منع انتشار الخطأ
  event.preventDefault();
});

/**
 * عرض إشعار على مستوى المتصفح
 * @param {string} message - نص الإشعار
 * @param {string} type - نوع الإشعار (info، success، warning، error)
 */
function showNotification(message, type = 'info') {
  console.log(`عرض إشعار (${type}):`, message);
  
  let iconUrl = 'icons/icon-48.png';
  let title = 'Auto-Inputs Pro';
  
  // تحديد الأيقونة والعنوان بناءً على نوع الإشعار
  switch (type) {
    case 'success':
      iconUrl = 'icons/success.png';
      title = 'نجاح!';
      break;
    case 'warning':
      iconUrl = 'icons/warning.png';
      title = 'تحذير!';
      break;
    case 'error':
      iconUrl = 'icons/error.png';
      title = 'خطأ!';
      break;
    default:
      iconUrl = 'icons/info.png';
      title = 'معلومات';
      break;
  }
  
  // إنشاء الإشعار
  chrome.notifications.create({
    type: 'basic',
    iconUrl: iconUrl,
    title: title,
    message: message,
    priority: type === 'error' ? 2 : 1,
    requireInteraction: type === 'error' // الإشعارات المهمة تتطلب تفاعل المستخدم
  });
}

/**
 * الحصول على إعدادات الامتداد الحالية
 * @returns {Promise<Object>} وعد يحتوي على إعدادات الامتداد
 */
async function getSettings() {
  try {
    return new Promise((resolve) => {
      chrome.storage.sync.get(null, (settings) => {
        const defaultSettings = {
          enabled: true,
          apiKey: '',
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxTokens: 800,
          darkMode: false,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          lastUpdated: new Date().toISOString()
        };
        
        // دمج الإعدادات المخزنة مع الإعدادات الافتراضية
        const mergedSettings = { ...defaultSettings, ...settings };
        resolve(mergedSettings);
      });
    });
  } catch (error) {
    console.error("خطأ في الحصول على الإعدادات:", error);
    throw new Error(`فشل الحصول على الإعدادات: ${error.message}`);
  }
}

/**
 * حفظ إعدادات الامتداد
 * @param {Object} settings - الإعدادات المراد حفظها
 * @returns {Promise<void>} وعد يشير إلى اكتمال العملية
 */
async function saveSettings(settings) {
  try {
    // تحديث وقت آخر تعديل
    settings.lastUpdated = new Date().toISOString();
    
    return new Promise((resolve) => {
      chrome.storage.sync.set(settings, () => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
        resolve();
      });
    });
  } catch (error) {
    console.error("خطأ في حفظ الإعدادات:", error);
    throw new Error(`فشل حفظ الإعدادات: ${error.message}`);
  }
}

/**
 * تسجيل طلب API في الإحصائيات
 * @param {boolean} success - ما إذا كان الطلب ناجحًا
 * @returns {Promise<void>} وعد يشير إلى اكتمال العملية
 */
async function logApiRequest(success) {
  try {
    const settings = await getSettings();
    
    // تحديث عدادات الإحصائيات
    settings.totalRequests = (settings.totalRequests || 0) + 1;
    
    if (success) {
      settings.successfulRequests = (settings.successfulRequests || 0) + 1;
    } else {
      settings.failedRequests = (settings.failedRequests || 0) + 1;
    }
    
    // حفظ الإعدادات المحدثة
    await saveSettings(settings);
    
    // تحديث شارة الامتداد لعرض عدد الطلبات الناجحة
    updateExtensionBadge(settings.successfulRequests);
    
    return Promise.resolve();
  } catch (error) {
    console.error("خطأ في تسجيل طلب API:", error);
    throw new Error(`فشل تسجيل طلب API: ${error.message}`);
  }
}

/**
 * تحديث شارة الامتداد
 * @param {number} count - العدد المراد عرضه على الشارة
 */
function updateExtensionBadge(count) {
  if (count > 0) {
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#28a745' }); // لون أخضر للطلبات الناجحة
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

/**
 * اختبار الاتصال بواجهة برمجة تطبيقات Gemini
 * @param {string} apiKey - مفتاح API المراد اختباره
 * @returns {Promise<Object>} وعد يحتوي على نتيجة الاختبار
 */
async function testApiConnection(apiKey) {
  try {
    if (!apiKey) {
      return { success: false, error: "مفتاح API غير موجود" };
    }
    
    // قائمة عناوين URL المحتملة للاتصال بواجهة برمجة تطبيقات Gemini
    const possibleEndpoints = [
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent",
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
      "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent",
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    ];
    
    // طلب بسيط للتحقق من الاتصال
    const requestData = {
      contents: [
        {
          parts: [
            {
              text: "Hello, this is a test request to verify API connectivity."
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 10
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
        const response = await fetch(urlWithKey, requestOptions);
        
        if (!response.ok) {
          const errorCode = response.status;
          let errorMessage = "";
          
          switch (errorCode) {
            case 400:
              errorMessage = "طلب غير صالح. تحقق من تنسيق البيانات المرسلة.";
              break;
            case 401:
              errorMessage = "غير مصرح. تحقق من صحة مفتاح API الخاص بك.";
              break;
            case 403:
              errorMessage = "محظور. ليس لديك إذن للوصول إلى هذه الخدمة.";
              break;
            case 404:
              errorMessage = `نقطة النهاية غير موجودة: ${endpoint}. المحاولة مع نقطة نهاية بديلة...`;
              console.log(errorMessage);
              continue;
            case 429:
              errorMessage = "تم تجاوز حد الطلبات. يرجى المحاولة مرة أخرى لاحقًا.";
              break;
            default:
              errorMessage = `خطأ غير معروف: ${errorCode}`;
          }
          
          if (errorCode !== 404) {
            return { success: false, error: errorMessage };
          }
        } else {
          // إذا وصلنا إلى هنا، فالاستجابة ناجحة
          const data = await response.json();
          const modelName = endpoint.includes("gemini-1.5-flash") ? "Gemini 1.5 Flash" :
                          endpoint.includes("gemini-2.0-flash") ? "Gemini 2.0 Flash" : 
                          endpoint.includes("gemini-pro") ? "Gemini Pro" : "Gemini API";
          
          return { 
            success: true, 
            model: data.model || modelName,
            endpoint: endpoint
          };
        }
      } catch (error) {
        console.error(`فشل الاتصال بـ ${endpoint}:`, error);
        // استمر في المحاولة مع نقطة النهاية التالية
      }
    }
    
    // إذا وصلنا إلى هنا، فشلت جميع المحاولات
    return { success: false, error: "فشلت جميع محاولات الاتصال بواجهة برمجة تطبيقات Gemini" };
  } catch (error) {
    console.error("خطأ في اختبار اتصال API:", error);
    return { success: false, error: error.message };
  }
}

/**
 * إعادة تعيين إحصائيات الطلبات
 * @returns {Promise<void>} وعد يشير إلى اكتمال العملية
 */
async function resetStatistics() {
  try {
    const settings = await getSettings();
    
    // إعادة تعيين عدادات الإحصائيات
    settings.totalRequests = 0;
    settings.successfulRequests = 0;
    settings.failedRequests = 0;
    
    // حفظ الإعدادات المحدثة
    await saveSettings(settings);
    
    // تحديث شارة الامتداد لإزالة العداد
    updateExtensionBadge(0);
    
    return Promise.resolve();
  } catch (error) {
    console.error("خطأ في إعادة تعيين الإحصائيات:", error);
    throw new Error(`فشل إعادة تعيين الإحصائيات: ${error.message}`);
  }
}

/**
 * تهيئة الامتداد عند التثبيت أو التحديث
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("تم تثبيت الامتداد أو تحديثه:", details.reason);
  
  try {
    // تهيئة الإعدادات الافتراضية عند التثبيت لأول مرة
    if (details.reason === 'install') {
      const defaultSettings = {
        enabled: true,
        apiKey: '',
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxTokens: 800,
        darkMode: false,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        lastUpdated: new Date().toISOString()
      };
      
      await saveSettings(defaultSettings);
      showNotification('تم تثبيت امتداد Auto-Inputs Pro بنجاح! قم بإضافة مفتاح API للبدء.', 'success');
    }
    
    // تحديث الشارة بناءً على الإحصائيات الحالية
    const settings = await getSettings();
    updateExtensionBadge(settings.successfulRequests);
    
  } catch (error) {
    console.error("خطأ في تهيئة الامتداد:", error);
    showNotification(`حدث خطأ أثناء تهيئة الامتداد: ${error.message}`, 'error');
  }
}); 