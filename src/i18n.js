// 多语言配置文件
const translations = {
  'zh-CN': {
    // 标签页
    tabRegister: '批量注册 / 账号管理',
    tabToken: '获取token/自动切号',
    tabSwitch: '登录到Windsurf',
    tabFreeAccounts: '免费账号',
    tabTutorial: '使用教程',
    tabSettings: '配置域名/邮箱',
    
    // 批量注册页面
    registerTitle: '批量注册账号',
    emailCount: '注册数量',
    emailCountPlaceholder: '输入要注册的账号数量',
    startRegister: '开始批量注册',
    
    // 账号管理
    accountManagement: '账号管理',
    totalAccounts: '总账号数',
    activeAccounts: '可用账号',
    warningAccounts: '即将到期',
    expiredAccounts: '已到期',
    deleteMode: '删除账号',
    exitDeleteMode: '退出删除账号',
    noAccounts: '暂无账号',
    
    // 表单标签
    emailDomainList: '邮箱域名列表（用于生成注册邮箱）',
    domainInputPlaceholder: '输入域名，如: example.com',
    imapConfigTitle: 'IMAP邮箱配置（用于接收验证码）',
    quickConfig: 'QQ 邮箱（当前仅支持 QQ 邮箱）',
    imapServer: 'IMAP服务器',
    imapHostPlaceholder: 'imap.example.com',
    port: '端口',
    emailAccount: '邮箱账号',
    emailPlaceholder: 'your@example.com',
    password: '密码',
    addAccountTitle: '添加账号',
    email: '邮箱',
    
    // 提示信息
    switchAccountTitle: '切换Windsurf账号',
    autoLoginProcess: '<strong>自动登录流程：</strong>重置配置和机器码 → 启动Windsurf → 自动登录选定账号 → 完成',
    switchTip: '<strong>💡 提示：</strong><strong>自动登录</strong>：一键完成所有步骤，包括浏览器登录（推荐） | <strong>重置Windsurf机器id</strong>：仅重置机器id，不启动应用',
    autoLoginTip: '<strong>⚠️ 重要提示：</strong><br>使用自动登录前，请检查浏览器是否已登录 Windsurf 账号。如果浏览器已登录，系统会直接使用浏览器中已登录的账号，而不会切换到您选择的账号。<br><strong>解决方法：</strong>如果需要在浏览器中退出登录，请访问 <a href="https://windsurf.com/profile" target="_blank" style="color: #007aff; text-decoration: underline;">https://windsurf.com/profile</a>，在页面左下角点击 <strong>Log out</strong> 按钮退出登录。',
    notSelectedAccount: '未选择账号',
    
    // 账号卡片
    expiryDate: '到期',
    daysLeft: '剩余',
    days: '天',
    expired: '已到期',
    
    // 切换账号页面
    switchAccount: '切换账号',
    selectAccount: '选择要切换的账号',
    selectedAccount: '已选择账号',
    notSelected: '未选择账号',
    usedAccounts: '已使用账号',
    noUsedAccounts: '暂无已使用账号',
    restore: '撤销',
    fullAutoSwitch: '完整自动化切换',
    
    // 免费账号页面
    freeAccountsTitle: '免费账号获取',
    
    // 配置页面
    settingsTitle: '配置域名/邮箱',
    emailDomains: '邮箱域名',
    addDomain: '添加域名',
    domainPlaceholder: '输入域名（如 example.com）',
    emailConfig: '邮箱配置',
    imapServer: 'IMAP服务器',
    imapPort: 'IMAP端口',
    smtpServer: 'SMTP服务器',
    smtpPort: 'SMTP端口',
    emailAddress: '邮箱地址',
    emailPassword: '邮箱密码',
    saveConfig: '保存所有配置',
    testConnection: '测试连接',
    languageSettings: '语言设置',
    selectLanguage: '选择语言',
    resetLanguage: '重新选择语言',
    resetLanguageTip: '点击后将返回语言选择界面',
    
    // 按钮
    confirm: '确认',
    cancel: '取消',
    delete: '删除',
    close: '关闭',
    add: '添加',
    refresh: '刷新列表',
    manualAdd: '手动添加账号',
    importAccounts: '导入账号',
    batchRegisterCount: '批量注册数量',
    batchRegisterThreads: '并发线程数',
    startBatchRegister: '开始注册',
    deleteModeOn: '删除账号：开',
    deleteModeOff: '删除账号：关',
    deleteAllAccounts: '删除全部账号',
    autoLogin: '🚀 自动登录',
    resetMachineId: '重置机器ID',
    addDomainBtn: '添加域名',
    importAccountsTitle: '导入账号',
    selectFile: '选择文件',
    import: '导入',
    exportAccounts: '导出账号',
    exportAccountsTitle: '导出账号',
    exportFormat: '导出格式（当前仅支持 JSON）',
    exportScope: '导出范围',
    export: '导出',
    
    // 消息提示
    registerSuccess: '注册成功',
    registerFailed: '注册失败',
    deleteSuccess: '删除成功',
    deleteFailed: '删除失败',
    saveSuccess: '保存成功',
    saveFailed: '保存失败',
    switchSuccess: '切换成功',
    switchFailed: '切换失败',
    pleaseSelectAccount: '请选择要切换的账号',
    confirmSwitch: '完整自动化切换将:\n1. 关闭并重置Windsurf\n2. 启动Windsurf并完成初始设置\n3. 自动在浏览器中登录\n\n确定继续吗？',
    errorOccurred: '发生错误',
    asyncOperationFailed: '异步操作失败',
    invalidRegisterCount: '请输入有效的注册数量',
    invalidThreadCount: '请输入有效的线程数（最小为1）',
    registerInProgress: '批量注册正在进行中，请勿重复点击',
    registering: '注册中...',
    cancelBatchRegister: '取消注册',
    confirmCancelRegister: '确定要取消批量注册吗？已注册成功的账号不会受影响。',
    registerCancelled: '批量注册已取消',
    cancelFailed: '取消失败',
    pleaseConfigureIMAP: '请先在"配置"页面设置IMAP邮箱配置',
    
    // 批量注册优化说明
    concurrencyOptimizationTitle: '🔧 并发线程优化说明',
    maxConcurrencyLimit: '• 最大并发限制：系统自动限制为6个浏览器窗口，经测试这是最佳性能平衡点',
    smartBatchProcessing: '• 智能分批处理：无论设置多少线程，都会按6个一批进行处理，每批间隔5秒',
    networkOptimization: '• 网络优化：超过6个窗口会导致网络请求失败，无法加载Windsurf注册页面',
    batchExample: '• 示例：设置100个账号，实际执行为：6个→等待5秒→6个→等待5秒...直到完成',
    pleaseCompleteInfo: '请填写完整信息',
    addSuccess: '添加成功！',
    addFailed: '添加失败',
    accountCopied: '账号信息已复制到剪贴板！',
    switchInProgress: '正在执行切换流程，请勿重复点击',
    pleaseEnterDomain: '请输入域名',
    domainExists: '域名已存在',
    pleaseCompleteIMAPConfig: '请填写完整的IMAP配置',
    
    // 状态
    processing: '处理中...',
    completed: '已完成',
    failed: '失败',
    
    // 语言选择界面
    welcomeTitle: 'Windsurf 账号管理器',
    selectLanguagePrompt: '选择语言 / Select Language',
    simplifiedChinese: '简体中文',
    english: 'English',
    pressEnterTip: '按 Enter 键使用默认语言（简体中文）',
    starting: '正在启动...'
  },
  
  'en': {
    // Tabs
    tabRegister: 'Batch Register / Account Management',
    tabToken: 'Token / Auto Switch',
    tabSwitch: 'Login to Windsurf',
    tabFreeAccounts: 'Free Accounts',
    tabTutorial: 'Tutorial',
    tabSettings: 'Domain/Email Settings',
    
    // Batch Register Page
    registerTitle: 'Batch Register Accounts',
    emailCount: 'Registration Count',
    emailCountPlaceholder: 'Enter number of accounts to register',
    startRegister: 'Start Batch Registration',
    
    // Account Management
    accountManagement: 'Account Management',
    totalAccounts: 'Total Accounts',
    activeAccounts: 'Available Accounts',
    warningAccounts: 'Expiring Soon',
    expiredAccounts: 'Expired',
    deleteMode: 'Delete Account',
    exitDeleteMode: 'Exit Delete Account',
    noAccounts: 'No accounts',
    
    // Form Labels
    emailDomainList: 'Email Domain List (for generating registration emails)',
    domainInputPlaceholder: 'Enter domain, e.g.: example.com',
    imapConfigTitle: 'IMAP Email Configuration (for receiving verification codes)',
    quickConfig: 'Quick Config',
    imapServer: 'IMAP Server',
    imapHostPlaceholder: 'imap.example.com',
    port: 'Port',
    emailAccount: 'Email Account',
    emailPlaceholder: 'your@example.com',
    password: 'Password',
    addAccountTitle: 'Add Account',
    email: 'Email',
    
    // Tips
    switchAccountTitle: 'Switch Windsurf Account',
    autoLoginProcess: '<strong>Auto Login Process:</strong>Reset config and machine ID → Start Windsurf → Auto login selected account → Complete',
    switchTip: '<strong>💡 Tip:</strong><strong>Auto Login</strong>: Complete all steps with one click, including browser login (Recommended) | <strong>Reset Windsurf Machine ID</strong>: Only reset machine ID, do not start application',
    autoLoginTip: '<strong>⚠️ Important Notice:</strong><br>Before using auto login, please check if your browser is already logged into a Windsurf account. If the browser is already logged in, the system will use the account logged in the browser instead of switching to your selected account.<br><strong>Solution:</strong>If you need to log out from the browser, please visit <a href="https://windsurf.com/profile" target="_blank" style="color: #007aff; text-decoration: underline;">https://windsurf.com/profile</a> and click the <strong>Log out</strong> button at the bottom left of the page.',
    notSelectedAccount: 'No account selected',
    
    // Account Card
    expiryDate: 'Expires',
    daysLeft: '',
    days: ' days left',
    expired: 'Expired',
    
    // Switch Account Page
    switchAccount: 'Switch Account',
    selectAccount: 'Select account to switch',
    selectedAccount: 'Selected account',
    notSelected: 'No account selected',
    usedAccounts: 'Used Accounts',
    noUsedAccounts: 'No used accounts',
    restore: 'Restore',
    fullAutoSwitch: 'Full Auto Switch',
    
    // Free Accounts Page
    freeAccountsTitle: 'Get Free Accounts',
    
    // Settings Page
    settingsTitle: 'Domain/Email Settings',
    emailDomains: 'Email Domains',
    addDomain: 'Add Domain',
    domainPlaceholder: 'Enter domain (e.g. example.com)',
    emailConfig: 'Email Configuration',
    imapServer: 'IMAP Server',
    imapPort: 'IMAP Port',
    smtpServer: 'SMTP Server',
    smtpPort: 'SMTP Port',
    emailAddress: 'Email Address',
    emailPassword: 'Email Password',
    saveConfig: 'Save Configuration',
    testConnection: 'Test Connection',
    languageSettings: 'Language Settings',
    selectLanguage: 'Select Language',
    resetLanguage: 'Reset Language Selection',
    resetLanguageTip: 'Click to return to language selection screen',
    
    // Buttons
    confirm: 'Confirm',
    cancel: 'Cancel',
    delete: 'Delete',
    close: 'Close',
    add: 'Add',
    refresh: 'Refresh List',
    manualAdd: 'Add Account Manually',
    importAccounts: 'Import Accounts',
    batchRegisterCount: 'Batch Register Count',
    batchRegisterThreads: 'Concurrent Threads',
    startBatchRegister: 'Start Register',
    deleteModeOn: 'Delete Account: ON',
    deleteModeOff: 'Delete Account: OFF',
    deleteAllAccounts: 'Delete All Accounts',
    autoLogin: '🚀 Auto Login',
    resetMachineId: 'Reset Machine ID',
    addDomainBtn: 'Add Domain',
    importAccountsTitle: 'Import Accounts',
    selectFile: 'Select File',
    import: 'Import',
    exportAccounts: 'Export Accounts',
    exportAccountsTitle: 'Export Accounts',
    exportFormat: 'Export Format (JSON only)',
    exportScope: 'Export Scope',
    export: 'Export',
    
    // Messages
    registerSuccess: 'Registration successful',
    registerFailed: 'Registration failed',
    deleteSuccess: 'Deletion successful',
    deleteFailed: 'Deletion failed',
    saveSuccess: 'Save successful',
    saveFailed: 'Save failed',
    switchSuccess: 'Switch successful',
    switchFailed: 'Switch failed',
    pleaseSelectAccount: 'Please select an account to switch',
    confirmSwitch: 'Full auto switch will:\n1. Close and reset Windsurf\n2. Start Windsurf and complete initial setup\n3. Auto login in browser\n\nContinue?',
    errorOccurred: 'Error occurred',
    asyncOperationFailed: 'Async operation failed',
    invalidRegisterCount: 'Please enter a valid registration count',
    invalidThreadCount: 'Please enter a valid thread count (minimum 1)',
    registerInProgress: 'Batch registration is in progress, please do not click repeatedly',
    registering: 'Registering...',
    cancelBatchRegister: 'Cancel Registration',
    confirmCancelRegister: 'Are you sure you want to cancel batch registration? Successfully registered accounts will not be affected.',
    registerCancelled: 'Batch registration cancelled',
    cancelFailed: 'Cancel failed',
    pleaseConfigureIMAP: 'Please configure IMAP email settings in "Settings" page first',
    
    // Batch Registration Optimization Description
    concurrencyOptimizationTitle: '🔧 Concurrency Thread Optimization',
    maxConcurrencyLimit: '• Max Concurrency Limit: System automatically limits to 6 browser windows, tested as optimal performance balance',
    smartBatchProcessing: '• Smart Batch Processing: Regardless of thread settings, processes in batches of 6 with 5-second intervals',
    networkOptimization: '• Network Optimization: More than 6 windows cause network failures, unable to load Windsurf registration page',
    batchExample: '• Example: Set 100 accounts, actual execution: 6→wait 5s→6→wait 5s...until complete',
    pleaseCompleteInfo: 'Please complete all information',
    addSuccess: 'Added successfully!',
    addFailed: 'Add failed',
    accountCopied: 'Account information copied to clipboard!',
    switchInProgress: 'Switch in progress, please do not click repeatedly',
    pleaseEnterDomain: 'Please enter domain',
    domainExists: 'Domain already exists',
    pleaseCompleteIMAPConfig: 'Please complete IMAP configuration',
    
    // Status
    processing: 'Processing...',
    completed: 'Completed',
    failed: 'Failed',
    
    // Language Selection Screen
    welcomeTitle: 'Windsurf Account Manager',
    selectLanguagePrompt: 'Select Language / 选择语言',
    simplifiedChinese: '简体中文',
    english: 'English',
    pressEnterTip: 'Press Enter to use default language (Simplified Chinese)',
    starting: 'Starting...'
  }
};

// 获取当前语言
function getCurrentLanguage() {
  return localStorage.getItem('app_language') || 'zh-CN';
}

// 设置语言
function setLanguage(lang) {
  localStorage.setItem('app_language', lang);
}

// 获取翻译文本
function t(key) {
  const lang = getCurrentLanguage();
  return translations[lang][key] || translations['zh-CN'][key] || key;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { translations, getCurrentLanguage, setLanguage, t };
}
