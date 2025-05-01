/**
 * ملف الإحصائيات والرسوم البيانية لامتداد Auto-Inputs-Pro
 * يحتوي على وظائف تتبع استخدام الامتداد وعرض البيانات في واجهة المستخدم
 */

// تنفيذ الكود بعد تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  console.log('تهيئة نظام الإحصائيات...');

  // تهيئة المتغيرات
  let statsData = {
    totalInputsFilled: 0,
    totalForms: 0,
    successRate: 0,
    timeSaved: 0,
    dailyUsage: [],
    completionRate: 0,
    lastUpdated: Date.now()
  };

  // اللغة الحالية
  let currentLanguage = document.documentElement.getAttribute('lang') || 'ar';

  // استماع لحدث تغيير اللغة
  window.addEventListener('languageChanged', (event) => {
    if (event.detail && event.detail.language) {
      currentLanguage = event.detail.language;
      updateStatsUI();
    }
  });

  // استرجاع الإحصائيات المخزنة
  function loadStats() {
    chrome.storage.sync.get('auto_inputs_stats', (result) => {
      if (result.auto_inputs_stats) {
        // التحقق من وجود بيانات حقيقية
        if (result.auto_inputs_stats.lastUpdated) {
          statsData = result.auto_inputs_stats;
          
          // تحديث مصفوفة الاستخدام اليومي إذا كانت فارغة أو قديمة
          if (!statsData.dailyUsage || statsData.dailyUsage.length === 0) {
            statsData.dailyUsage = initDailyUsage(7);
          }
          
          // التحقق مما إذا كان اليوم جديدًا لإضافة سجل جديد
          updateDailyStats();
        } else {
          // البيانات قديمة، قم بتهيئتها
          initRealStats();
        }
      } else {
        // لا توجد بيانات، قم بتهيئة إحصائيات حقيقية
        initRealStats();
      }
      updateStatsUI();
    });
  }

  // تهيئة إحصائيات حقيقية
  function initRealStats() {
    statsData = {
      totalInputsFilled: 0,
      totalForms: 0,
      successRate: 0,
      timeSaved: 0,
      dailyUsage: initDailyUsage(7),
      completionRate: 0,
      lastUpdated: Date.now()
    };
    saveStats();
  }

  // تهيئة مصفوفة استخدام يومي فارغة
  function initDailyUsage(days) {
    const data = [];
    for (let i = 0; i < days; i++) {
      data.push(0);
    }
    return data;
  }

  // تحديث الإحصائيات اليومية
  function updateDailyStats() {
    if (!statsData.dailyUsage) {
      statsData.dailyUsage = initDailyUsage(7);
    }
    
    // التحقق مما إذا كان اليوم جديدًا
    const lastDate = new Date(statsData.lastUpdated);
    const today = new Date();
    
    if (lastDate.toDateString() !== today.toDateString()) {
      // يوم جديد، قم بإزاحة المصفوفة وإضافة يوم جديد
      statsData.dailyUsage.shift();
      statsData.dailyUsage.push(0);
      statsData.lastUpdated = Date.now();
      saveStats();
    }
  }

  // تحديث عناصر واجهة المستخدم بالإحصائيات
  function updateStatsUI() {
    // تحديث البطاقات
    document.getElementById('totalInputsFilled').textContent = statsData.totalInputsFilled;
    document.getElementById('totalForms').textContent = statsData.totalForms;
    document.getElementById('successRate').textContent = statsData.successRate + '%';
    document.getElementById('timeSaved').textContent = statsData.timeSaved;
    
    // تحديث شريط التقدم
    document.getElementById('completionRateValue').textContent = statsData.completionRate + '%';
    document.querySelector('.progress-bar').style.width = statsData.completionRate + '%';
    
    // رسم المخطط البياني
    renderUsageChart();

    // تحديث نص الفترة الزمنية حسب اللغة
    updateStatsLabels();
  }

  // تحديث تسميات الإحصائيات بناءً على اللغة
  function updateStatsLabels() {
    // تحديث العنوان
    const langKey = currentLanguage || 'ar';
    const translations = window.translations || {};
    const t = translations[langKey] || {};

    // تحديث عنوان الفترة الزمنية
    const periodLabel = document.querySelector('.stats-period');
    if (periodLabel) {
      if (langKey === 'en') {
        periodLabel.textContent = t.stats?.period || 'Last 30 days';
      } else {
        periodLabel.textContent = t.stats?.period || 'آخر 30 يوم';
      }
    }
  }

  // متغير عام للمخطط البياني
  let usageChartInstance = null;

  // رسم المخطط البياني لاستخدام الامتداد
  function renderUsageChart() {
    const ctx = document.getElementById('usageChart');
    
    // التحقق إذا كان عنصر canvas موجود
    if (!ctx) {
      console.warn('عنصر canvas للمخطط البياني غير موجود في الصفحة');
      return;
    }
    
    // التحقق من وجود مخطط سابق وإزالته
    if (usageChartInstance) {
      try {
        usageChartInstance.destroy();
      } catch (e) {
        console.warn('خطأ عند محاولة إزالة المخطط السابق:', e);
      }
      usageChartInstance = null;
    }
    
    // إعداد بيانات المخطط
    const days = getLastNDays(7);
    const data = statsData.dailyUsage || initDailyUsage(7);
    
    try {
      // احصل على ألوان متغيرات CSS للمخطط
      const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-color-1').trim() || '#4e73df';
      const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-color-2').trim() || '#1cc88a';
      
      // الحصول على نص تسمية المخطط حسب اللغة
      const chartLabel = currentLanguage === 'en' ? 'Fields Filled' : 'عدد الحقول المملوءة';
      
      // إنشاء المخطط
      usageChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: days,
          datasets: [{
            label: chartLabel,
            data: data,
            backgroundColor: primaryColor,
            borderColor: secondaryColor,
            borderWidth: 1,
            borderRadius: 5,
            barPercentage: 0.7,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0,0,0,0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              titleFont: {
                family: 'Tajawal, Cairo, sans-serif',
                size: 12
              },
              bodyFont: {
                family: 'Tajawal, Cairo, sans-serif',
                size: 12
              },
              padding: 10,
              cornerRadius: 6,
              displayColors: false,
              rtl: currentLanguage === 'ar'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                font: {
                  family: 'Tajawal, Cairo, sans-serif',
                  size: 10
                }
              },
              grid: {
                display: true,
                color: 'rgba(200, 200, 200, 0.15)'
              }
            },
            x: {
              ticks: {
                font: {
                  family: 'Tajawal, Cairo, sans-serif',
                  size: 10
                }
              },
              grid: {
                display: false
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('خطأ في إنشاء المخطط البياني:', error);
    }
  }

  // الحصول على أسماء الأيام الأخيرة
  function getLastNDays(n) {
    const days = [];
    const localeCode = currentLanguage === 'en' ? 'en-US' : 'ar-EG';
    
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toLocaleDateString(localeCode, { weekday: 'short' }));
    }
    return days;
  }

  // تحديث الإحصائيات عند ملء حقل
  function updateFieldFilledStats(count = 1) {
    statsData.totalInputsFilled += count;
    
    // تحديث إحصائيات اليوم الحالي
    updateDailyStats();
    statsData.dailyUsage[statsData.dailyUsage.length - 1] += count;
    
    saveStats();
  }

  // تحديث الإحصائيات عند ملء نموذج
  function updateFormCompletedStats() {
    statsData.totalForms += 1;
    saveStats();
  }

  // حساب الوقت المدخر (تقريبي: 20 ثانية لكل حقل)
  function updateTimeSavedStats(fieldsCount) {
    // تقدير الوقت المدخر بالثواني (20 ثانية لكل حقل)
    const savedSeconds = fieldsCount * 20;
    // تحويل إلى دقائق
    statsData.timeSaved += Math.round(savedSeconds / 60);
    saveStats();
  }

  // حفظ الإحصائيات
  function saveStats() {
    chrome.storage.sync.set({ 'auto_inputs_stats': statsData });
  }

  // استماع لأحداث من الامتداد
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'fieldsProcessed') {
      // تحديث الإحصائيات بعدد الحقول التي تم ملؤها
      updateFieldFilledStats(message.count);
      
      // تحديث إحصائيات الوقت المدخر
      updateTimeSavedStats(message.count);
      
      // تحديث إحصائيات النماذج المكتملة إذا تم ملء نموذج كامل
      if (message.formCompleted) {
        updateFormCompletedStats();
      }
      
      // تحديث معدل النجاح
      if (message.successRate) {
        statsData.successRate = message.successRate;
      }
      
      // تحديث معدل الإكمال
      if (message.completionRate) {
        statsData.completionRate = message.completionRate;
      }
      
      // تحديث واجهة المستخدم
      updateStatsUI();
      
      sendResponse({ success: true });
    } else if (message.action === 'languageChanged') {
      if (message.language) {
        currentLanguage = message.language;
        updateStatsUI();
      }
    }
  });

  // حدث تغيير الثيم (الوضع المظلم/الفاتح)
  function handleThemeChange() {
    // إعادة رسم المخطط البياني عند تغيير الثيم
    setTimeout(renderUsageChart, 300);
  }

  // تحميل الإحصائيات عند تحميل الصفحة
  loadStats();
  
  // تصدير الوظائف لاستخدامها في ملفات أخرى
  window.statsManager = {
    updateFieldFilledStats,
    updateFormCompletedStats,
    updateTimeSavedStats,
    handleThemeChange,
    getChart: () => usageChartInstance,
    updateChart: () => {
      if (usageChartInstance) {
        try {
          usageChartInstance.update();
        } catch (e) {
          console.warn('خطأ في تحديث المخطط البياني:', e);
          // إعادة رسم المخطط إذا فشل التحديث
          renderUsageChart();
        }
      } else {
        renderUsageChart();
      }
    },
    updateLanguage: (language) => {
      if (language) {
        currentLanguage = language;
        updateStatsUI();
      }
    }
  };
}); 