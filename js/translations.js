/**
 * ملف ترجمات Auto-Inputs-Pro
 * يحتوي على جميع النصوص المترجمة للغات المدعومة
 */

// تنفيذ الكود فورًا لتتوفر الترجمات عند تحميل الملف
(function() {
  try {
    console.log('جاري تهيئة ملف الترجمات...');
    
    const translations = {
      // الترجمات العربية
      ar: {
        // عام
        appName: "Auto-Inputs-Pro",
        appDescription: "ملء الحقول تلقائيًا بذكاء اصطناعي متطور",
        footer: "تطوير شركة RebixRise © 2025",
        
        // تبويبات
        tabs: {
          apiSettings: "إعدادات API",
          generalSettings: "إعدادات عامة",
          features: "المميزات",
          stats: "الإحصائيات",
          backup: "النسخ الاحتياطي"
        },
        
        // إعدادات API
        apiSettings: {
          title: "إعداد الذكاء الاصطناعي",
          selectModel: "اختر نموذج الذكاء الاصطناعي:",
          models: {
            gemini: "Google Gemini",
            openai: "OpenAI (قريباً)",
            anthropic: "Anthropic Claude (قريباً)"
          },
          apiKeyPlaceholder: "أدخل مفتاح API الخاص بك",
          geminiApiKeyTooltip: "يمكنك الحصول على مفتاح API من موقع Google AI Studio للوصول إلى نماذج Gemini.",
          getApiKey: "احصل على مفتاح Gemini",
          saveButton: "حفظ المفتاح"
        },
        
        // إعدادات عامة
        generalSettings: {
          title: "إعدادات إضافية",
          autoSubmit: "تقديم النماذج تلقائيًا بعد الملء",
          autoSubmitTooltip: "عند تفعيل هذا الخيار، سيقوم الامتداد بالضغط تلقائياً على زر الإرسال بعد ملء جميع الحقول في النموذج",
          showNotifications: "عرض إشعارات على صفحة الويب",
          showNotificationsTooltip: "تظهر إشعارات على صفحة الويب لإبلاغك بحالة الملء وتقدمه",
          formFillDelay: "تأخير بين ملء الحقول (مللي ثانية):",
          formFillDelayTooltip: "تخصيص الوقت بين ملء كل حقل والآخر، مما يجعل الملء يبدو أكثر طبيعية"
        },
        
        // المميزات
        features: {
          title: "مميزات الامتداد",
          fillAllInputs: {
            title: "ملء جميع الحقول",
            description: "اضغط بزر الماوس الأيمن في أي مكان بالصفحة واختر \"Fill All Inputs\""
          },
          fillForm: {
            title: "ملء النموذج الحالي",
            description: "اضغط بزر الماوس الأيمن على أي حقل واختر \"Fill This Form\""
          },
          fillInput: {
            title: "ملء حقل واحد",
            description: "اضغط بزر الماوس الأيمن على الحقل الذي تريد ملئه واختر \"Fill This Input\""
          }
        },
        
        // الإحصائيات
        stats: {
          title: "إحصائيات الاستخدام",
          period: "آخر 30 يوم",
          totalInputs: "حقول تم ملؤها",
          totalForms: "نماذج مكتملة",
          successRate: "معدل النجاح",
          timeSaved: "دقائق تم توفيرها",
          completionRate: "معدل إكمال الحقول: "
        },
        
        // النسخ الاحتياطي
        backup: {
          title: "نسخ احتياطي للإعدادات",
          export: "تصدير الإعدادات",
          import: "استيراد الإعدادات"
        },
        
        // رسائل الحالة
        status: {
          settingsLoaded: "تم استعادة الإعدادات بنجاح",
          enterApiKey: "يرجى إدخال مفتاح API الخاص بك",
          invalidApiKey: "يبدو أن تنسيق مفتاح API غير صحيح",
          settingsSaved: "تم حفظ الإعدادات بنجاح!",
          exportSuccess: "تم تصدير الإعدادات بنجاح!",
          importSuccess: "تم استيراد الإعدادات بنجاح!",
          invalidFile: "الملف ليس في التنسيق الصحيح",
          importError: "حدث خطأ أثناء استيراد الإعدادات",
          noActiveField: "لم يتم تحديد حقل نشط",
          unknownError: "خطأ غير معروف",
          fieldFillError: "تعذر ملء الحقل",
          invalidResponse: "استجابة غير صالحة من الذكاء الاصطناعي"
        },
        
        // أزرار وعناصر واجهة المستخدم
        ui: {
          showPassword: '<i class="fa-solid fa-eye"></i>',
          hidePassword: '<i class="fa-solid fa-eye-slash"></i>',
          modelPlaceholders: {
            gemini: "أدخل مفتاح API الخاص بك من Google Gemini",
            openai: "أدخل مفتاح API الخاص بك من OpenAI",
            anthropic: "أدخل مفتاح API الخاص بك من Anthropic Claude"
          }
        },
        
        // شاشة الترحيب
        welcome: {
          title: "مرحبًا بك في Auto-Inputs-Pro",
          subtitle: "شكراً لتثبيت الإضافة! دعنا نبدأ باستخدامها",
          step1: "قم بالحصول على مفتاح API من Google Gemini وإضافته في إعدادات API",
          step2: "أضف الامتداد إلى قائمة السياق (النقر بزر الماوس الأيمن) من إعدادات المتصفح",
          step3: "انقر بزر الماوس الأيمن على أي نموذج واختر \"Fill This Form\" لملئه تلقائيًا",
          startButton: "ابدأ الاستخدام"
        },
        
        // الإشعارات
        notifications: {
          fillingInputs: "جاري ملء {count} حقل...",
          filledInputsProgress: "تم ملء {filled} من {total} حقل...",
          filledInputsSuccess: "تم ملء {count} حقل بنجاح!",
          noInputsFilled: "لم يتم ملء أي حقول",
          undoInProgress: "جاري التراجع عن الملء السابق...",
          undoSuccess: "تم التراجع عن الملء السابق بنجاح",
          noUndoAvailable: "لا توجد عمليات ملء سابقة للتراجع عنها",
          undo: "تراجع",
          close: "إغلاق"
        }
      },
      
      // الترجمات الإنجليزية
      en: {
        // General
        appName: "Auto-Inputs-Pro",
        appDescription: "Advanced AI form filler",
        footer: "Developed by RebixRise © 2025",
        
        // Tabs
        tabs: {
          apiSettings: "API Settings",
          generalSettings: "General Settings",
          features: "Features",
          stats: "Statistics",
          backup: "Backup"
        },
        
        // API Settings
        apiSettings: {
          title: "AI Configuration",
          selectModel: "Choose AI Model:",
          models: {
            gemini: "Google Gemini",
            openai: "OpenAI (Coming Soon)",
            anthropic: "Anthropic Claude (Coming Soon)"
          },
          apiKeyPlaceholder: "Enter your API key",
          geminiApiKeyTooltip: "You can get an API key from Google AI Studio to access Gemini models.",
          getApiKey: "Get Gemini Key",
          saveButton: "Save Key"
        },
        
        // General Settings
        generalSettings: {
          title: "Additional Settings",
          autoSubmit: "Submit forms automatically after filling",
          autoSubmitTooltip: "When enabled, the extension will automatically click the submit button after filling all fields in a form",
          showNotifications: "Show notifications on webpage",
          showNotificationsTooltip: "Display notifications on the webpage to inform you about filling status and progress",
          formFillDelay: "Delay between filling fields (milliseconds):",
          formFillDelayTooltip: "Customize the time between filling each field, making the filling process appear more natural"
        },
        
        // Features
        features: {
          title: "Extension Features",
          fillAllInputs: {
            title: "Fill All Fields",
            description: "Right-click anywhere on the page and choose \"Fill All Inputs\""
          },
          fillForm: {
            title: "Fill Current Form",
            description: "Right-click any field and choose \"Fill This Form\""
          },
          fillInput: {
            title: "Fill Single Field",
            description: "Right-click the field you want to fill and choose \"Fill This Input\""
          }
        },
        
        // Statistics
        stats: {
          title: "Usage Statistics",
          period: "Last 30 days",
          totalInputs: "Fields Filled",
          totalForms: "Forms Completed",
          successRate: "Success Rate",
          timeSaved: "Minutes Saved",
          completionRate: "Fields Completion Rate: "
        },
        
        // Backup
        backup: {
          title: "Settings Backup",
          export: "Export Settings",
          import: "Import Settings"
        },
        
        // Status messages
        status: {
          settingsLoaded: "Settings restored successfully",
          enterApiKey: "Please enter your API key",
          invalidApiKey: "API key format appears to be invalid",
          settingsSaved: "Settings saved successfully!",
          exportSuccess: "Settings exported successfully!",
          importSuccess: "Settings imported successfully!",
          invalidFile: "The file is not in the correct format",
          importError: "An error occurred while importing settings",
          noActiveField: "No active field selected",
          unknownError: "Unknown error",
          fieldFillError: "Failed to fill field",
          invalidResponse: "Invalid response from AI"
        },
        
        // UI elements
        ui: {
          showPassword: '<i class="fa-solid fa-eye"></i>',
          hidePassword: '<i class="fa-solid fa-eye-slash"></i>',
          modelPlaceholders: {
            gemini: "Enter your API key from Google Gemini",
            openai: "Enter your API key from OpenAI",
            anthropic: "Enter your API key from Anthropic Claude"
          }
        },
        
        // Welcome screen
        welcome: {
          title: "Welcome to Auto-Inputs-Pro",
          subtitle: "Thanks for installing! Let's get started",
          step1: "Get an API key from Google Gemini and add it in API settings",
          step2: "Add the extension to the context menu (right-click) from browser settings",
          step3: "Right-click on any form and choose \"Fill This Form\" to fill it automatically",
          startButton: "Get Started"
        },
        
        // Notifications
        notifications: {
          fillingInputs: "Filling {count} fields...",
          filledInputsProgress: "Filled {filled} of {total} fields...",
          filledInputsSuccess: "Successfully filled {count} fields!",
          noInputsFilled: "No fields were filled",
          undoInProgress: "Undoing previous fill...",
          undoSuccess: "Successfully undid previous fill",
          noUndoAvailable: "No previous fill actions to undo",
          undo: "Undo",
          close: "Close"
        }
      }
    };
    
    // تصدير كائن الترجمات إلى النافذة للاستخدام في ملفات أخرى
    window.translations = translations;
    console.log('تم تصدير كائن الترجمات بنجاح! اللغات المتاحة:', Object.keys(translations).join(', '));
    
    // ذاكرة تخزين مؤقت للترجمات
    let translationCache = {};
    
    // Helper function to get translation
    function getTranslation(lang, key) {
      // التحقق من الذاكرة المؤقتة أولاً
      const cacheKey = `${lang}:${key}`;
      if (translationCache[cacheKey]) {
        return translationCache[cacheKey];
      }
      
      // Get the current language translations
      const langData = translations[lang] || translations.ar;
      
      // Split the key by dots to navigate nested objects
      const keys = key.split('.');
      let result = langData;
      
      // Navigate through the nested objects
      for (const k of keys) {
        if (result && result[k] !== undefined) {
          result = result[k];
        } else {
          // If key not found, return the key itself
          return key;
        }
      }
      
      // تخزين النتيجة في الذاكرة المؤقتة
      translationCache[cacheKey] = result;
      
      return result;
    }
    
    // Helper function to replace placeholders in translation strings
    function formatTranslation(text, replacements) {
      if (!replacements || typeof text !== 'string') {
        return text;
      }
      
      let formattedText = text;
      
      // Replace all placeholders with their values
      Object.keys(replacements).forEach(key => {
        formattedText = formattedText.replace(new RegExp(`{${key}}`, 'g'), replacements[key]);
      });
      
      return formattedText;
    }
    
    // دالة لمسح الذاكرة المؤقتة للترجمات
    function clearCache() {
      translationCache = {};
    }
    
    // تصدير الدوال للاستخدام في ملفات أخرى
    window.getTranslation = getTranslation;
    window.formatTranslation = formatTranslation;
    window.clearCache = clearCache;
    
    // تنبيه بأن الملف أصبح جاهزًا
    console.log('ملف الترجمات جاهز للاستخدام!');
    
    // إطلاق حدث خاص عند اكتمال تحميل الترجمات
    setTimeout(() => {
      const event = new CustomEvent('translationsReady');
      window.dispatchEvent(event);
    }, 0);
    
  } catch (error) {
    console.error('خطأ في تهيئة ملف الترجمات:', error);
  }
})(); 