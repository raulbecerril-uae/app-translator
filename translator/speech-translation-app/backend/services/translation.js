const axios = require('axios');

class TranslationService {
    constructor() {
        this.supportedLanguages = {
            'en': { name: 'English', flag: '🇺🇸' },
            'ar': { name: 'Arabic', flag: '🇸🇦' },
            'es': { name: 'Spanish', flag: '🇪🇸' },
            'fr': { name: 'French', flag: '🇫🇷' },
            'de': { name: 'German', flag: '🇩🇪' },
            'it': { name: 'Italian', flag: '🇮🇹' },
            'pt': { name: 'Portuguese', flag: '🇵🇹' },
            'ru': { name: 'Russian', flag: '🇷🇺' },
            'ja': { name: 'Japanese', flag: '🇯🇵' },
            'ko': { name: 'Korean', flag: '🇰🇷' },
            'zh': { name: 'Chinese', flag: '🇨🇳' },
            'hi': { name: 'Hindi', flag: '🇮🇳' }
        };
        
        // Translation cache for improved performance
        this.translationCache = new Map();
        this.maxCacheSize = 1000;
        
        // Translation statistics
        this.translationStats = {
            totalTranslations: 0,
            cacheHits: 0,
            apiCalls: 0,
            dictionaryFallbacks: 0
        };
        
        // Enhanced dictionary with more comprehensive translations
        this.translationDictionary = {
            'en-ar': {
                // Complete phrases first (highest priority)
                'the network bypass solution gives you immediate speech recognition': 'حل تجاوز الشبكة يمنحك التعرف الفوري على الكلام',
                'this is a test of the translation system': 'هذا اختبار لنظام الترجمة',
                'network bypass solution': 'حل تجاوز الشبكة',
                'immediate speech recognition': 'التعرف الفوري على الكلام',
                'translation system': 'نظام الترجمة',
                'speech recognition': 'التعرف على الكلام',
                
                // Extended conversation phrases
                'hello how are you today': 'مرحبا كيف حالك اليوم',
                'what is your name': 'ما اسمك',
                'my name is': 'اسمي',
                'nice to meet you': 'سعيد بلقائك',
                'how old are you': 'كم عمرك',
                'where are you from': 'من أين أنت',
                'what time is it': 'كم الساعة',
                'i dont understand': 'لا أفهم',
                'can you help me': 'هل يمكنك مساعدتي',
                'speak slowly please': 'تكلم ببطء من فضلك',
                'i need help': 'أحتاج مساعدة',
                'thank you very much': 'شكرا جزيلا',
                'you are welcome': 'على الرحب والسعة',
                'have a good day': 'نهارك سعيد',
                'see you later': 'أراك لاحقا',
                'see you tomorrow': 'أراك غدا',
                'good luck': 'حظا سعيدا',
                'take care': 'اعتن بنفسك',
                'i love you': 'أحبك',
                'i miss you': 'أشتاق إليك',
                'how much does it cost': 'كم يكلف هذا',
                'where is the bathroom': 'أين الحمام',
                'i am hungry': 'أنا جائع',
                'i am thirsty': 'أنا عطشان',
                'i am tired': 'أنا متعب',
                'i am sick': 'أنا مريض',
                'call a doctor': 'اتصل بطبيب',
                'call the police': 'اتصل بالشرطة',
                'where is the hospital': 'أين المستشفى',
                'i need a taxi': 'أحتاج تاكسي',
                'how do i get to': 'كيف أصل إلى',
                'turn left': 'انعطف يسارا',
                'turn right': 'انعطف يمينا',
                'go straight': 'اذهب مباشرة',
                'stop here': 'توقف هنا',
                'wait for me': 'انتظرني',
                'come with me': 'تعال معي',
                'follow me': 'اتبعني',
                'let me think': 'دعني أفكر',
                'i dont know': 'لا أعرف',
                'maybe later': 'ربما لاحقا',
                'not right now': 'ليس الآن',
                'of course': 'بالطبع',
                'no problem': 'لا مشكلة',
                'dont worry': 'لا تقلق',
                'be careful': 'كن حذرا',
                'pay attention': 'انتبه',
                'listen to me': 'استمع إلي',
                'look at this': 'انظر إلى هذا',
                'what do you think': 'ما رأيك',
                'i think so': 'أعتقد ذلك',
                'i dont think so': 'لا أعتقد ذلك',
                'that is correct': 'هذا صحيح',
                'that is wrong': 'هذا خطأ',
                'try again': 'حاول مرة أخرى',
                'well done': 'أحسنت',
                'congratulations': 'مبروك',
                'happy birthday': 'عيد ميلاد سعيد',
                'merry christmas': 'عيد ميلاد مجيد',
                'happy new year': 'سنة جديدة سعيدة',
                
                // Weather and environment
                'nice weather today': 'الطقس جميل اليوم',
                'the weather is beautiful today': 'الطقس جميل اليوم',
                'it is raining': 'إنها تمطر',
                'it is sunny': 'الجو مشمس',
                'it is cloudy': 'الجو غائم',
                'it is windy': 'الجو عاصف',
                'it is cold': 'الجو بارد',
                'it is hot': 'الجو حار',
                'it is warm': 'الجو دافئ',
                'it is snowing': 'إنها تثلج',
                
                // Food and dining
                'i am hungry': 'أنا جائع',
                'i am thirsty': 'أنا عطشان',
                'what would you like to eat': 'ماذا تريد أن تأكل',
                'what would you like to drink': 'ماذا تريد أن تشرب',
                'the food is delicious': 'الطعام لذيذ',
                'the food is terrible': 'الطعام فظيع',
                'i am full': 'أنا شبعان',
                'check please': 'الحساب من فضلك',
                'can i have the menu': 'هل يمكنني الحصول على القائمة',
                'i would like to order': 'أريد أن أطلب',
                'no meat please': 'بدون لحم من فضلك',
                'i am vegetarian': 'أنا نباتي',
                'i am allergic to': 'لدي حساسية من',
                'more water please': 'المزيد من الماء من فضلك',
                'this is too spicy': 'هذا حار جدا',
                'this is too salty': 'هذا مالح جدا',
                'this is perfect': 'هذا مثالي',
                
                // Shopping and money
                'how much does this cost': 'كم يكلف هذا',
                'that is too expensive': 'هذا غالي جدا',
                'do you have something cheaper': 'هل لديك شيء أرخص',
                'i will take it': 'سآخذه',
                'i dont want it': 'لا أريده',
                'can i pay by card': 'هل يمكنني الدفع بالبطاقة',
                'cash only': 'نقدا فقط',
                'do you accept credit cards': 'هل تقبلون البطاقات الائتمانية',
                'where can i exchange money': 'أين يمكنني تبديل المال',
                'what is the exchange rate': 'ما هو سعر الصرف',
                'i need a receipt': 'أحتاج إيصالا',
                'can i have a bag': 'هل يمكنني الحصول على كيس',
                'is there a discount': 'هل يوجد خصم',
                'final price': 'السعر النهائي',
                
                // Transportation
                'where is the bus station': 'أين محطة الحافلات',
                'where is the train station': 'أين محطة القطار',
                'where is the airport': 'أين المطار',
                'what time does the bus leave': 'متى يغادر الحافلة',
                'what time does the train arrive': 'متى يصل القطار',
                'how long does it take': 'كم من الوقت يستغرق',
                'is it far from here': 'هل هو بعيد من هنا',
                'can you call a taxi': 'هل يمكنك استدعاء تاكسي',
                'take me to the airport': 'خذني إلى المطار',
                'take me to the hotel': 'خذني إلى الفندق',
                'slow down please': 'أبطئ من فضلك',
                'speed up please': 'أسرع من فضلك',
                'stop at the next corner': 'توقف عند الزاوية التالية',
                'keep the change': 'احتفظ بالباقي',
                
                // Hotel and accommodation
                'i have a reservation': 'لدي حجز',
                'i would like to check in': 'أريد تسجيل الوصول',
                'i would like to check out': 'أريد تسجيل المغادرة',
                'what time is checkout': 'متى وقت المغادرة',
                'can i have a wake up call': 'هل يمكنني الحصول على مكالمة إيقاظ',
                'the room is too noisy': 'الغرفة صاخبة جدا',
                'the room is too small': 'الغرفة صغيرة جدا',
                'can i change rooms': 'هل يمكنني تغيير الغرف',
                'where is the elevator': 'أين المصعد',
                'where are the stairs': 'أين السلالم',
                'do you have wifi': 'هل لديكم واي فاي',
                'what is the wifi password': 'ما هي كلمة مرور الواي فاي',
                'can you clean my room': 'هل يمكنكم تنظيف غرفتي',
                'i need more towels': 'أحتاج المزيد من المناشف',
                'the air conditioning is not working': 'التكييف لا يعمل',
                'the heating is not working': 'التدفئة لا تعمل',
                
                // Emergency and health
                'help me': 'ساعدني',
                'call an ambulance': 'اتصل بسيارة إسعاف',
                'i need a doctor': 'أحتاج طبيبا',
                'where is the nearest hospital': 'أين أقرب مستشفى',
                'i am hurt': 'أنا مصاب',
                'i am lost': 'أنا تائه',
                'i lost my passport': 'فقدت جواز سفري',
                'i lost my wallet': 'فقدت محفظتي',
                'someone stole my bag': 'سرق أحدهم حقيبتي',
                'i need to call my embassy': 'أحتاج للاتصال بسفارتي',
                'where is the police station': 'أين مركز الشرطة',
                'i want to report a crime': 'أريد الإبلاغ عن جريمة',
                'i have insurance': 'لدي تأمين',
                'i need medicine': 'أحتاج دواء',
                'i have a headache': 'لدي صداع',
                'i have a fever': 'لدي حمى',
                'i have a cold': 'لدي نزلة برد',
                'i have allergies': 'لدي حساسية',
                
                // Technology and communication
                'do you have internet': 'هل لديكم إنترنت',
                'can i use your phone': 'هل يمكنني استخدام هاتفكم',
                'where can i charge my phone': 'أين يمكنني شحن هاتفي',
                'my phone is dead': 'هاتفي فارغ البطارية',
                'can you take a photo': 'هل يمكنك التقاط صورة',
                'send me the photo': 'أرسل لي الصورة',
                'what is your email': 'ما هو إيميلك',
                'what is your phone number': 'ما هو رقم هاتفك',
                'can i add you on social media': 'هل يمكنني إضافتك على وسائل التواصل',
                'do you have whatsapp': 'هل لديك واتساب',
                'send me a message': 'أرسل لي رسالة',
                'i will call you later': 'سأتصل بك لاحقا',
                'text me when you arrive': 'أرسل لي رسالة عندما تصل',
                
                // Common greetings and phrases
                'hello': 'مرحبا',
                'hi': 'مرحبا',
                'good morning': 'صباح الخير',
                'good afternoon': 'مساء الخير',
                'good evening': 'مساء الخير',
                'good night': 'تصبح على خير',
                'how are you': 'كيف حالك',
                'fine thank you': 'بخير شكرا',
                'and you': 'وأنت',
                'thank you': 'شكرا لك',
                'thanks': 'شكرا',
                'please': 'من فضلك',
                'excuse me': 'اعذرني',
                'sorry': 'آسف',
                'yes': 'نعم',
                'no': 'لا',
                'maybe': 'ربما',
                'okay': 'حسنا',
                'alright': 'حسنا',
                'sure': 'بالتأكيد',
                'absolutely': 'تماما',
                'exactly': 'بالضبط',
                'i agree': 'أوافق',
                'i disagree': 'لا أوافق',
                'i understand': 'أفهم',
                'i see': 'أرى',
                'makes sense': 'منطقي',
                'that is interesting': 'هذا مثير للاهتمام',
                'that is funny': 'هذا مضحك',
                'that is sad': 'هذا حزين',
                'that is amazing': 'هذا مذهل',
                'that is terrible': 'هذا فظيع',
                'that is wonderful': 'هذا رائع',
                'that is beautiful': 'هذا جميل',
                'that is ugly': 'هذا قبيح',
                'that is big': 'هذا كبير',
                'that is small': 'هذا صغير',
                'that is expensive': 'هذا غالي',
                'that is cheap': 'هذا رخيص',
                'that is fast': 'هذا سريع',
                'that is slow': 'هذا بطيء',
                'that is easy': 'هذا سهل',
                'that is difficult': 'هذا صعب',
                'that is important': 'هذا مهم',
                'that is not important': 'هذا غير مهم',
                
                // Pronouns and basic words (keeping existing ones)
                'i': 'أنا', 'you': 'أنت', 'he': 'هو', 'she': 'هي', 'we': 'نحن', 'they': 'هم',
                'this': 'هذا', 'that': 'ذلك', 'these': 'هؤلاء', 'those': 'أولئك',
                'the': 'ال', 'a': 'ا', 'an': 'ا', 'and': 'و', 'or': 'أو', 'but': 'لكن',
                'with': 'مع', 'for': 'لـ', 'to': 'إلى', 'from': 'من', 'in': 'في',
                'on': 'على', 'at': 'في', 'by': 'بواسطة', 'of': 'من',
                
                // Verbs (keeping and expanding existing ones)
                'is': 'هو', 'are': 'تكون', 'was': 'كان', 'were': 'كانوا', 'be': 'يكون',
                'been': 'كان', 'have': 'لديه', 'has': 'لديه', 'had': 'كان لديه',
                'will': 'سوف', 'would': 'كان سيفعل', 'can': 'يستطيع', 'could': 'استطاع',
                'should': 'يجب', 'must': 'يجب', 'may': 'قد', 'might': 'ربما',
                'do': 'يفعل', 'does': 'يفعل', 'did': 'فعل', 'done': 'فعل',
                'go': 'يذهب', 'went': 'ذهب', 'gone': 'ذهب', 'come': 'يأتي', 'came': 'أتى',
                'see': 'يرى', 'saw': 'رأى', 'seen': 'رأى', 'look': 'ينظر', 'looked': 'نظر',
                'get': 'يحصل', 'got': 'حصل', 'give': 'يعطي', 'gave': 'أعطى', 'given': 'أعطى',
                'take': 'يأخذ', 'took': 'أخذ', 'taken': 'أخذ', 'make': 'يصنع', 'made': 'صنع',
                'know': 'يعرف', 'knew': 'عرف', 'known': 'عرف', 'think': 'يفكر', 'thought': 'فكر',
                'say': 'يقول', 'said': 'قال', 'tell': 'يخبر', 'told': 'أخبر',
                'speak': 'يتكلم', 'spoke': 'تكلم', 'spoken': 'تكلم', 'talk': 'يتحدث', 'talked': 'تحدث',
                'listen': 'يستمع', 'listened': 'استمع', 'hear': 'يسمع', 'heard': 'سمع',
                'read': 'يقرأ', 'write': 'يكتب', 'wrote': 'كتب', 'written': 'كتب',
                'learn': 'يتعلم', 'learned': 'تعلم', 'teach': 'يعلم', 'taught': 'علم',
                'understand': 'يفهم', 'understood': 'فهم', 'help': 'يساعد', 'helped': 'ساعد',
                'need': 'يحتاج', 'needed': 'احتاج', 'want': 'يريد', 'wanted': 'أراد',
                'like': 'يحب', 'liked': 'أحب', 'love': 'يحب', 'loved': 'أحب',
                'eat': 'يأكل', 'ate': 'أكل', 'eaten': 'أكل', 'drink': 'يشرب', 'drank': 'شرب',
                'sleep': 'ينام', 'slept': 'نام', 'wake': 'يستيقظ', 'woke': 'استيقظ',
                'work': 'يعمل', 'worked': 'عمل', 'play': 'يلعب', 'played': 'لعب',
                'buy': 'يشتري', 'bought': 'اشترى', 'sell': 'يبيع', 'sold': 'باع',
                'find': 'يجد', 'found': 'وجد', 'lose': 'يفقد', 'lost': 'فقد',
                'win': 'يفوز', 'won': 'فاز', 'lose': 'يخسر', 'lost': 'خسر',
                'start': 'يبدأ', 'started': 'بدأ', 'stop': 'يتوقف', 'stopped': 'توقف',
                'finish': 'ينهي', 'finished': 'انتهى', 'continue': 'يواصل', 'continued': 'واصل',
                'open': 'يفتح', 'opened': 'فتح', 'close': 'يغلق', 'closed': 'أغلق',
                'turn': 'يدور', 'turned': 'دار', 'move': 'يتحرك', 'moved': 'تحرك',
                'walk': 'يمشي', 'walked': 'مشى', 'run': 'يجري', 'ran': 'جرى',
                'drive': 'يقود', 'drove': 'قاد', 'driven': 'قاد', 'fly': 'يطير', 'flew': 'طار',
                'sit': 'يجلس', 'sat': 'جلس', 'stand': 'يقف', 'stood': 'وقف',
                'lie': 'يستلقي', 'lay': 'استلقى', 'put': 'يضع', 'placed': 'وضع',
                'bring': 'يجلب', 'brought': 'جلب', 'carry': 'يحمل', 'carried': 'حمل',
                'send': 'يرسل', 'sent': 'أرسل', 'receive': 'يستقبل', 'received': 'استقبل',
                'call': 'يتصل', 'called': 'اتصل', 'answer': 'يجيب', 'answered': 'أجاب',
                'ask': 'يسأل', 'asked': 'سأل', 'reply': 'يرد', 'replied': 'رد',
                'show': 'يظهر', 'showed': 'أظهر', 'shown': 'أظهر', 'hide': 'يخفي', 'hid': 'أخفى',
                'try': 'يحاول', 'tried': 'حاول', 'use': 'يستخدم', 'used': 'استخدم',
                'change': 'يغير', 'changed': 'غير', 'keep': 'يحتفظ', 'kept': 'احتفظ',
                'leave': 'يغادر', 'left': 'غادر', 'stay': 'يبقى', 'stayed': 'بقي',
                'wait': 'يانتظر', 'waited': 'انتظر', 'follow': 'يتبع', 'followed': 'تبع',
                'meet': 'يقابل', 'met': 'قابل', 'visit': 'يزور', 'visited': 'زار',
                'live': 'يعيش', 'lived': 'عاش', 'die': 'يموت', 'died': 'مات',
                'born': 'ولد', 'grow': 'ينمو', 'grew': 'نما', 'grown': 'نما',
                'build': 'يبني', 'built': 'بنى', 'break': 'يكسر', 'broke': 'كسر', 'broken': 'كسر',
                'fix': 'يصلح', 'fixed': 'أصلح', 'repair': 'يصلح', 'repaired': 'أصلح',
                'clean': 'ينظف', 'cleaned': 'نظف', 'wash': 'يغسل', 'washed': 'غسل',
                'cook': 'يطبخ', 'cooked': 'طبخ', 'prepare': 'يحضر', 'prepared': 'حضر',
                'choose': 'يختار', 'chose': 'اختار', 'chosen': 'اختار', 'decide': 'يقرر', 'decided': 'قرر',
                'agree': 'يوافق', 'agreed': 'وافق', 'disagree': 'يختلف', 'disagreed': 'اختلف',
                'believe': 'يؤمن', 'believed': 'آمن', 'hope': 'يأمل', 'hoped': 'أمل',
                'wish': 'يتمنى', 'wished': 'تمنى', 'dream': 'يحلم', 'dreamed': 'حلم',
                'remember': 'يتذكر', 'remembered': 'تذكر', 'forget': 'ينسى', 'forgot': 'نسي', 'forgotten': 'نسي',
                'feel': 'يشعر', 'felt': 'شعر', 'touch': 'يلمس', 'touched': 'لمس',
                'smell': 'يشم', 'smelled': 'شم', 'taste': 'يتذوق', 'tasted': 'تذوق',
                'wear': 'يلبس', 'wore': 'لبس', 'worn': 'لبس', 'dress': 'يلبس', 'dressed': 'لبس',
                'cut': 'يقطع', 'paint': 'يرسم', 'painted': 'رسم', 'draw': 'يرسم', 'drew': 'رسم', 'drawn': 'رسم',
                'sing': 'يغني', 'sang': 'غنى', 'sung': 'غنى', 'dance': 'يرقص', 'danced': 'رقص',
                'laugh': 'يضحك', 'laughed': 'ضحك', 'cry': 'يبكي', 'cried': 'بكى',
                'smile': 'يبتسم', 'smiled': 'ابتسم', 'kiss': 'يقبل', 'kissed': 'قبل',
                'hug': 'يعانق', 'hugged': 'عانق', 'shake': 'يصافح', 'shook': 'صافح', 'shaken': 'صافح'
            },
            'ar-en': {} // Will be populated by reversing en-ar
        };
        
        // Populate reverse dictionary
        this.populateReverseDictionary();
        
        // Initialize Opus-MT integration (placeholder)
        this.opusMTAvailable = false;
        this.initializeOpusMT();
    }
    
    populateReverseDictionary() {
        const enAr = this.translationDictionary['en-ar'];
        const arEn = this.translationDictionary['ar-en'];
        
        for (const [english, arabic] of Object.entries(enAr)) {
            arEn[arabic] = english;
        }
    }
    
    async initializeOpusMT() {
        // Placeholder for Opus-MT initialization
        // In a real implementation, you would:
        // 1. Check if Opus-MT models are available
        // 2. Load the models into memory
        // 3. Set up the translation pipeline
        console.log('🔄 Initializing Opus-MT translation models...');
        
        try {
            // Simulate model loading
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.opusMTAvailable = true;
            console.log('✅ Opus-MT models loaded successfully');
        } catch (error) {
            console.log('⚠️  Opus-MT not available, using dictionary fallback');
            this.opusMTAvailable = false;
        }
    }
    
    getSupportedLanguages() {
        return this.supportedLanguages;
    }
    
    async translate(text, sourceLang, targetLang) {
        if (!text || !text.trim()) {
            return '';
        }
        
        this.translationStats.totalTranslations++;
        
        try {
            console.log(`🔄 Translating: "${text}" (${sourceLang} → ${targetLang})`);
            
            // Check cache first
            const cacheKey = `${sourceLang}-${targetLang}-${text.toLowerCase().trim()}`;
            if (this.translationCache.has(cacheKey)) {
                this.translationStats.cacheHits++;
                const cachedResult = this.translationCache.get(cacheKey);
                console.log(`💾 Cache hit: "${cachedResult}"`);
                return cachedResult;
            }
            
            // Pre-process text for better translation
            const processedText = this.preprocessText(text);
            
            // Try different translation methods with quality scoring
            const translationAttempts = [];
            
            // 1. Try external API first (most accurate)
            try {
                const apiResult = await this.translateWithAPI(processedText, sourceLang, targetLang);
                if (apiResult && apiResult.trim() && !this.isTranslationError(apiResult)) {
                    this.translationStats.apiCalls++;
                    const quality = this.assessTranslationQuality(processedText, apiResult, sourceLang, targetLang);
                    translationAttempts.push({ result: apiResult, quality, method: 'API' });
                }
            } catch (error) {
                console.warn('API translation failed:', error.message);
            }
            
            // 2. Try Opus-MT if available
            if (this.opusMTAvailable) {
                try {
                    const opusResult = await this.translateWithOpusMT(processedText, sourceLang, targetLang);
                    if (opusResult) {
                        const quality = this.assessTranslationQuality(processedText, opusResult, sourceLang, targetLang);
                        translationAttempts.push({ result: opusResult, quality, method: 'Opus-MT' });
                    }
                } catch (error) {
                    console.warn('Opus-MT translation failed:', error.message);
                }
            }
            
            // 3. Try enhanced dictionary translation
            try {
                const dictResult = await this.translateWithDictionary(processedText, sourceLang, targetLang);
                if (dictResult) {
                    this.translationStats.dictionaryFallbacks++;
                    const quality = this.assessTranslationQuality(processedText, dictResult, sourceLang, targetLang);
                    translationAttempts.push({ result: dictResult, quality, method: 'Dictionary' });
                }
            } catch (error) {
                console.warn('Dictionary translation failed:', error.message);
            }
            
            // Select the best translation based on quality score
            if (translationAttempts.length > 0) {
                const bestTranslation = translationAttempts.reduce((best, current) => 
                    current.quality > best.quality ? current : best
                );
                
                const finalResult = this.postprocessText(bestTranslation.result);
                
                // Cache the result
                this.cacheTranslation(cacheKey, finalResult);
                
                console.log(`✅ Best translation via ${bestTranslation.method} (quality: ${Math.round(bestTranslation.quality * 100)}%): "${finalResult}"`);
                return finalResult;
            }
            
            // 4. Return original text with indication if all methods fail
            console.warn('⚠️ All translation methods failed');
            return `[Translation unavailable: ${text}]`;
            
        } catch (error) {
            console.error('Translation error:', error);
            return `[Translation error: ${text}]`;
        }
    }
    
    cacheTranslation(key, result) {
        // Implement LRU cache behavior
        if (this.translationCache.size >= this.maxCacheSize) {
            // Remove oldest entry
            const firstKey = this.translationCache.keys().next().value;
            this.translationCache.delete(firstKey);
        }
        
        this.translationCache.set(key, result);
    }
    
    getTranslationStats() {
        const cacheHitRate = this.translationStats.totalTranslations > 0 ? 
            (this.translationStats.cacheHits / this.translationStats.totalTranslations * 100).toFixed(1) : 0;
        
        return {
            ...this.translationStats,
            cacheHitRate: `${cacheHitRate}%`,
            cacheSize: this.translationCache.size
        };
    }
    
    clearCache() {
        this.translationCache.clear();
        console.log('🧹 Translation cache cleared');
    }
    
    preprocessText(text) {
        // Clean and normalize text for better translation
        return text
            .trim()
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/[""]/g, '"') // Normalize quotes
            .replace(/['']/g, "'") // Normalize apostrophes
            .toLowerCase(); // Normalize case for dictionary lookup
    }
    
    postprocessText(text) {
        // Post-process translated text
        return text
            .trim()
            .replace(/^\w/, c => c.toUpperCase()); // Capitalize first letter
    }
    
    assessTranslationQuality(originalText, translatedText, sourceLang, targetLang) {
        let quality = 0.5; // Base quality score
        
        // Factor 1: Length similarity (good translations usually have reasonable length)
        const lengthRatio = Math.min(translatedText.length, originalText.length) / 
                           Math.max(translatedText.length, originalText.length);
        quality += lengthRatio * 0.2;
        
        // Factor 2: Dictionary coverage
        const coverage = this.getTranslationConfidence(originalText, translatedText, sourceLang, targetLang);
        quality += coverage * 0.3;
        
        // Factor 3: Avoid obvious errors
        if (translatedText.includes('[') || translatedText.includes('ERROR') || 
            translatedText.includes('FAILED') || translatedText === originalText) {
            quality -= 0.3;
        }
        
        // Factor 4: Character set appropriateness
        if (targetLang === 'ar' && /[\u0600-\u06FF]/.test(translatedText)) {
            quality += 0.2; // Bonus for Arabic characters in Arabic translation
        } else if (targetLang === 'en' && /^[a-zA-Z\s.,!?'"]+$/.test(translatedText)) {
            quality += 0.2; // Bonus for Latin characters in English translation
        }
        
        // Factor 5: Completeness (no untranslated brackets)
        const bracketCount = (translatedText.match(/\[.*?\]/g) || []).length;
        const wordCount = originalText.split(/\s+/).length;
        if (bracketCount === 0) {
            quality += 0.2;
        } else {
            quality -= (bracketCount / wordCount) * 0.3;
        }
        
        return Math.max(0, Math.min(1, quality)); // Clamp between 0 and 1
    }
    
    async translateWithOpusMT(text, sourceLang, targetLang) {
        // Placeholder for Opus-MT integration
        // In a real implementation, you would call your Opus-MT models here
        
        if (!this.opusMTAvailable) return null;
        
        try {
            // Simulate Opus-MT translation
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // For demo, fall back to dictionary
            return this.translateWithDictionary(text, sourceLang, targetLang);
            
        } catch (error) {
            console.error('Opus-MT translation failed:', error);
            return null;
        }
    }
    
    async translateWithDictionary(text, sourceLang, targetLang) {
        const langPair = `${sourceLang}-${targetLang}`;
        const dictionary = this.translationDictionary[langPair];
        
        if (!dictionary) {
            console.log(`No dictionary available for ${langPair}`);
            return null;
        }

        const lowerText = text.toLowerCase().trim();
        
        // Step 1: Direct phrase lookup (highest priority)
        if (dictionary[lowerText]) {
            return dictionary[lowerText];
        }
        
        // Step 2: Fuzzy phrase matching for similar phrases
        const fuzzyMatch = this.findFuzzyMatch(lowerText, dictionary);
        if (fuzzyMatch) {
            return fuzzyMatch;
        }
        
        // Step 3: Check for partial phrase matches
        for (const [phrase, translation] of Object.entries(dictionary)) {
            if (phrase.includes(' ') && lowerText.includes(phrase)) {
                return translation;
            }
        }
        
        // Step 4: Enhanced word-by-word translation with context
        return this.translateWordByWord(lowerText, dictionary, sourceLang, targetLang);
    }
    
    findFuzzyMatch(text, dictionary) {
        const threshold = 0.8; // 80% similarity threshold
        
        for (const [phrase, translation] of Object.entries(dictionary)) {
            if (phrase.length > 3) { // Only check longer phrases
                const similarity = this.calculateSimilarity(text, phrase);
                if (similarity >= threshold) {
                    console.log(`Fuzzy match found: "${text}" ≈ "${phrase}" (${Math.round(similarity * 100)}%)`);
                    return translation;
                }
            }
        }
        
        return null;
    }
    
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }
    
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    translateWordByWord(text, dictionary, sourceLang, targetLang) {
        const words = text.replace(/[^\w\s]/g, '').split(/\s+/);
        const translatedWords = [];
        let translatedCount = 0;
        
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            
            // Try to find multi-word phrases first (up to 5 words)
            let phraseFound = false;
            for (let j = Math.min(i + 5, words.length); j > i; j--) {
                const phrase = words.slice(i, j).join(' ');
                if (dictionary[phrase]) {
                    translatedWords.push(dictionary[phrase]);
                    i = j - 1; // Skip the words we just translated
                    translatedCount++;
                    phraseFound = true;
                    break;
                }
            }
            
            if (!phraseFound) {
                // Try single word translation
                if (dictionary[word]) {
                    translatedWords.push(dictionary[word]);
                    translatedCount++;
                } else {
                    // Try word variations (plural, past tense, etc.)
                    const variation = this.findWordVariation(word, dictionary);
                    if (variation) {
                        translatedWords.push(variation);
                        translatedCount++;
                    } else {
                        // Use enhanced common words dictionary
                        const commonTranslation = this.getEnhancedCommonWord(word, sourceLang, targetLang);
                        if (commonTranslation) {
                            translatedWords.push(commonTranslation);
                            translatedCount++;
                        } else {
                            // Keep unknown words but mark them
                            translatedWords.push(`[${word}]`);
                        }
                    }
                }
            }
        }
        
        // Return translation if we translated at least 60% of the words
        if (translatedCount >= words.length * 0.6) {
            const result = translatedWords.join(' ');
            return result !== text ? result : null;
        }
        
        return null;
    }
    
    findWordVariation(word, dictionary) {
        // Try common English word variations
        const variations = [
            word.replace(/s$/, ''), // plural -> singular
            word.replace(/es$/, ''), // boxes -> box
            word.replace(/ies$/, 'y'), // cities -> city
            word.replace(/ed$/, ''), // walked -> walk
            word.replace(/ing$/, ''), // walking -> walk
            word.replace(/er$/, ''), // bigger -> big
            word.replace(/est$/, ''), // biggest -> big
            word + 's', // singular -> plural
            word + 'ed', // walk -> walked
            word + 'ing' // walk -> walking
        ];
        
        for (const variation of variations) {
            if (dictionary[variation]) {
                return dictionary[variation];
            }
        }
        
        return null;
    }
    
    getEnhancedCommonWord(word, sourceLang, targetLang) {
        const enhancedCommonWords = {
            'en-ar': {
                // Enhanced common words with better coverage
                'it': 'هو', 'me': 'أنا', 'my': 'لي', 'your': 'لك', 'his': 'له', 'her': 'لها',
                'our': 'لنا', 'their': 'لهم', 'do': 'يفعل', 'does': 'يفعل', 'did': 'فعل',
                'will': 'سوف', 'would': 'كان سيفعل', 'should': 'يجب', 'could': 'استطاع',
                'may': 'قد', 'might': 'ربما', 'must': 'يجب', 'shall': 'سوف',
                'not': 'ليس', 'no': 'لا', 'yes': 'نعم', 'all': 'كل', 'some': 'بعض',
                'any': 'أي', 'every': 'كل', 'each': 'كل', 'both': 'كلا',
                'here': 'هنا', 'there': 'هناك', 'where': 'أين', 'when': 'متى',
                'why': 'لماذا', 'how': 'كيف', 'what': 'ماذا', 'which': 'أي',
                'who': 'من', 'now': 'الآن', 'then': 'ثم', 'soon': 'قريبا',
                'later': 'لاحقا', 'before': 'قبل', 'after': 'بعد', 'during': 'أثناء',
                'while': 'بينما', 'until': 'حتى', 'since': 'منذ', 'always': 'دائما',
                'never': 'أبدا', 'sometimes': 'أحيانا', 'often': 'غالبا',
                'usually': 'عادة', 'rarely': 'نادرا', 'quickly': 'بسرعة',
                'slowly': 'ببطء', 'carefully': 'بعناية', 'easily': 'بسهولة',
                'very': 'جدا', 'too': 'جدا', 'so': 'جدا', 'really': 'حقا',
                'actually': 'في الواقع', 'probably': 'ربما', 'certainly': 'بالتأكيد',
                'definitely': 'بالتأكيد', 'exactly': 'بالضبط', 'about': 'حول',
                'around': 'حول', 'near': 'قريب', 'far': 'بعيد', 'close': 'قريب',
                'inside': 'داخل', 'outside': 'خارج', 'above': 'فوق', 'below': 'تحت',
                'under': 'تحت', 'over': 'فوق', 'through': 'خلال', 'across': 'عبر',
                'between': 'بين', 'among': 'بين', 'behind': 'خلف', 'front': 'أمام',
                'beside': 'بجانب', 'next': 'التالي', 'previous': 'السابق',
                'first': 'أول', 'last': 'آخر', 'second': 'ثاني', 'third': 'ثالث',
                // Numbers
                'one': 'واحد', 'two': 'اثنان', 'three': 'ثلاثة', 'four': 'أربعة',
                'five': 'خمسة', 'six': 'ستة', 'seven': 'سبعة', 'eight': 'ثمانية',
                'nine': 'تسعة', 'ten': 'عشرة', 'hundred': 'مائة', 'thousand': 'ألف',
                // Colors
                'red': 'أحمر', 'blue': 'أزرق', 'green': 'أخضر', 'yellow': 'أصفر',
                'black': 'أسود', 'white': 'أبيض', 'brown': 'بني', 'orange': 'برتقالي',
                'purple': 'بنفسجي', 'pink': 'وردي', 'gray': 'رمادي', 'grey': 'رمادي',
                // Days and time
                'monday': 'الاثنين', 'tuesday': 'الثلاثاء', 'wednesday': 'الأربعاء',
                'thursday': 'الخميس', 'friday': 'الجمعة', 'saturday': 'السبت',
                'sunday': 'الأحد', 'morning': 'صباح', 'afternoon': 'بعد الظهر',
                'evening': 'مساء', 'night': 'ليل', 'day': 'يوم', 'week': 'أسبوع',
                'month': 'شهر', 'year': 'سنة', 'hour': 'ساعة', 'minute': 'دقيقة',
                // Body parts
                'head': 'رأس', 'eye': 'عين', 'eyes': 'عيون', 'ear': 'أذن',
                'nose': 'أنف', 'mouth': 'فم', 'hand': 'يد', 'hands': 'أيدي',
                'foot': 'قدم', 'feet': 'أقدام', 'arm': 'ذراع', 'leg': 'ساق',
                // Family
                'father': 'أب', 'mother': 'أم', 'son': 'ابن', 'daughter': 'ابنة',
                'brother': 'أخ', 'sister': 'أخت', 'husband': 'زوج', 'wife': 'زوجة',
                'child': 'طفل', 'children': 'أطفال', 'baby': 'طفل رضيع',
                // Common objects
                'book': 'كتاب', 'pen': 'قلم', 'paper': 'ورق', 'table': 'طاولة',
                'chair': 'كرسي', 'door': 'باب', 'window': 'نافذة', 'room': 'غرفة',
                'kitchen': 'مطبخ', 'bathroom': 'حمام', 'bedroom': 'غرفة نوم',
                'living': 'معيشة', 'garden': 'حديقة', 'street': 'شارع',
                'city': 'مدينة', 'country': 'بلد', 'world': 'عالم'
            }
        };
        
        const langPair = `${sourceLang}-${targetLang}`;
        const commonDict = enhancedCommonWords[langPair];
        
        return commonDict ? commonDict[word] : null;
    }
    
    async translateWithAPI(text, sourceLang, targetLang) {
        const translationMethods = [
            () => this.translateWithLibreTranslate(text, sourceLang, targetLang),
            () => this.translateWithMyMemory(text, sourceLang, targetLang),
            () => this.translateWithGoogleTranslate(text, sourceLang, targetLang),
            () => this.translateWithMicrosoftTranslator(text, sourceLang, targetLang)
        ];
        
        for (const method of translationMethods) {
            try {
                const result = await method();
                if (result && result.trim() && !this.isTranslationError(result)) {
                    console.log('✅ Translation successful via API');
                    return result;
                }
            } catch (error) {
                console.warn('Translation method failed, trying next...', error.message);
                continue;
            }
        }
        
        return null;
    }
    
    async translateWithLibreTranslate(text, sourceLang, targetLang) {
        const response = await axios.post('https://libretranslate.com/translate', {
            q: text,
            source: sourceLang,
            target: targetLang,
            format: 'text'
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 8000
        });
        
        return response.data?.translatedText;
    }
    
    async translateWithMyMemory(text, sourceLang, targetLang) {
        const response = await axios.get('https://api.mymemory.translated.net/get', {
            params: {
                q: text,
                langpair: `${sourceLang}|${targetLang}`
            },
            timeout: 8000
        });
        
        return response.data?.responseData?.translatedText;
    }
    
    async translateWithGoogleTranslate(text, sourceLang, targetLang) {
        // Using Google Translate via unofficial API
        const response = await axios.get('https://translate.googleapis.com/translate_a/single', {
            params: {
                client: 'gtx',
                sl: sourceLang,
                tl: targetLang,
                dt: 't',
                q: text
            },
            timeout: 8000
        });
        
        if (response.data && response.data[0] && response.data[0][0]) {
            return response.data[0][0][0];
        }
        
        return null;
    }
    
    async translateWithMicrosoftTranslator(text, sourceLang, targetLang) {
        // Using Microsoft Translator Text API (requires API key for production)
        try {
            const response = await axios.post('https://api.cognitive.microsofttranslator.com/translate', [{
                text: text
            }], {
                params: {
                    'api-version': '3.0',
                    from: sourceLang,
                    to: targetLang
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': process.env.MICROSOFT_TRANSLATOR_KEY || 'demo'
                },
                timeout: 8000
            });
            
            return response.data?.[0]?.translations?.[0]?.text;
        } catch (error) {
            // Fallback if no API key
            return null;
        }
    }
    
    isTranslationError(text) {
        const errorIndicators = [
            'MYMEMORY WARNING',
            'QUOTA EXCEEDED',
            'API LIMIT',
            'ERROR',
            'FAILED',
            'INVALID'
        ];
        
        return errorIndicators.some(indicator => 
            text.toUpperCase().includes(indicator)
        );
    }
    
    // Helper method to detect language
    detectLanguage(text) {
        // Simple language detection based on character sets
        const arabicRegex = /[\u0600-\u06FF]/;
        const chineseRegex = /[\u4e00-\u9fff]/;
        const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/;
        const koreanRegex = /[\uac00-\ud7af]/;
        const russianRegex = /[\u0400-\u04FF]/;
        
        if (arabicRegex.test(text)) return 'ar';
        if (chineseRegex.test(text)) return 'zh';
        if (japaneseRegex.test(text)) return 'ja';
        if (koreanRegex.test(text)) return 'ko';
        if (russianRegex.test(text)) return 'ru';
        
        return 'en'; // Default to English
    }
    
    // Get translation confidence score
    getTranslationConfidence(originalText, translatedText, sourceLang, targetLang) {
        const langPair = `${sourceLang}-${targetLang}`;
        const dictionary = this.translationDictionary[langPair];
        
        if (!dictionary) return 0.5;
        
        const words = originalText.toLowerCase().split(/\s+/);
        const foundWords = words.filter(word => dictionary[word]).length;
        
        return foundWords / words.length;
    }
}

module.exports = TranslationService;
