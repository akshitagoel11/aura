# 🚀 Aura AI Frontend Integration Setup

## 📋 Overview

This document provides complete instructions for integrating the Aura AI frontend with the n8n backend workflow. The backend is already deployed and fully functional at `https://n8n.mediajade.com/webhook`.

---

## 🔧 Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in your project root:

```bash
# Aura AI Configuration
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.mediajade.com/webhook

# Development settings
NODE_ENV=development
```

### 2. Install Dependencies

The integration uses standard React/Next.js dependencies. Make sure you have:

```bash
npm install
# or
yarn install
```

### 3. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

The app will be available at `http://localhost:3000`

---

## 🧪 Testing the Integration

### Method 1: Main App Testing
1. Go to `http://localhost:3000`
2. Use the main input field to test natural language commands
3. Examples to try:
   - "Send email to john about meeting tomorrow at 2pm"
   - "Create task to finish Q4 report by Friday"
   - "Remind me to call mom tomorrow at 5pm"
   - "How can I be more productive?"

### Method 2: Dedicated Test Page
1. Go to `http://localhost:3000/test`
2. Use the test buttons to verify each intent type
3. View detailed API responses and execution results

---

## 📁 File Structure

```
src/
├── services/
│   └── auraAI.service.ts     # API service layer
├── utils/
│   ├── notifications.ts       # Toast notifications
│   └── errorHandler.ts       # Error handling utilities
├── components/
│   ├── AuraAIInput.tsx       # Main input component
│   ├── PreviewCard.tsx       # Preview display component
│   └── TestIntegration.tsx   # Testing component
└── app/
    ├── page.tsx              # Main app page
    └── test/
        └── page.tsx          # Test page
```

---

## 🔌 API Integration Details

### Service Layer (`auraAI.service.ts`)

The service layer handles all communication with the n8n backend:

```typescript
// Generate preview
const preview = await auraAIService.generatePreview({
  userId: 'user_123',
  input: 'Send email to john about meeting'
});

// Execute approved preview
const result = await auraAIService.executePreview({
  userId: 'user_123',
  intentType: 'email',
  approvedPreview: preview.preview,
  executionId: preview.executionId
});
```

### Supported Intent Types

1. **Email**: Sends emails via Gmail integration
2. **Task**: Creates tasks in Google Tasks
3. **Reminder**: Adds events to Google Calendar
4. **Chat**: Provides AI-powered productivity advice

---

## 🎨 UI Components

### AuraAIInput Component
- Main input field with natural language processing
- Loading states and error handling
- Example prompts for quick testing
- Integration with preview system

### PreviewCard Component
- Displays AI-generated previews
- Intent-specific formatting (email, task, reminder, chat)
- Confidence score display
- Approve/Reject functionality
- AI reasoning explanation

### TestIntegration Component
- Dedicated testing interface
- One-click testing for all intent types
- Detailed API response viewing
- Execution testing capabilities

---

## 🔍 Testing Checklist

### ✅ Basic Functionality
- [ ] App loads without errors
- [ ] Input field accepts text
- [ ] Generate Preview button works
- [ ] Loading states display correctly

### ✅ Intent Testing
- [ ] Email intent generates correct preview
- [ ] Task intent generates correct preview
- [ ] Reminder intent generates correct preview
- [ ] Chat intent generates correct preview

### ✅ Execution Testing
- [ ] Email execution sends actual email
- [ ] Task execution creates Google Task
- [ ] Reminder execution creates Calendar event
- [ ] Chat execution provides response

### ✅ UI/UX Testing
- [ ] Success notifications appear
- [ ] Error handling works gracefully
- [ ] Responsive design on mobile
- [ ] Links work (task links, calendar links)

---

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - The n8n backend is configured with CORS headers
   - If you see CORS errors, check the browser console for details

2. **Network Errors**
   - Verify internet connection
   - Check if `https://n8n.mediajade.com` is accessible
   - Try accessing the webhook URL directly

3. **Import Errors**
   - All imports use relative paths (not `@/` aliases)
   - Verify file paths are correct

4. **TypeScript Errors**
   - The code includes proper TypeScript interfaces
   - Check for any missing type definitions

### Debug Mode

Enable detailed logging by checking the browser console:
- API requests and responses
- Error details
- Component state changes

---

## 📱 Mobile Testing

The responsive design works on:
- iOS Safari (iPhone/iPad)
- Chrome Mobile (Android)
- Tablet browsers
- Progressive Web App (PWA) support

---

## 🔐 Security Notes

- No API keys are exposed in the frontend
- All sensitive operations happen on the n8n backend
- User authentication should be implemented (currently using demo user ID)
- HTTPS is required for production

---

## 🚀 Production Deployment

### Before Going Live

1. **Authentication**
   - Replace demo user ID with real authentication
   - Implement proper user session management

2. **Error Boundaries**
   - Add React error boundaries
   - Implement comprehensive error logging

3. **Performance**
   - Add loading skeletons
   - Implement request timeouts
   - Add retry logic for failed requests

4. **Analytics**
   - Add usage tracking
   - Monitor API performance
   - Track user engagement

### Environment Variables for Production

```bash
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.mediajade.com/webhook
NODE_ENV=production
```

---

## 🎯 Success Criteria

Your integration is complete when:

✅ Users can type natural language commands  
✅ AI generates accurate previews with confidence scores  
✅ Previews display beautifully in the UI  
✅ Users can approve/reject previews  
✅ Approved actions execute successfully  
✅ Success notifications appear with working links  
✅ All 4 intent types (email, task, reminder, chat) work perfectly  
✅ Error handling is graceful and informative  
✅ UI is responsive and works on mobile devices  
✅ Test page provides comprehensive testing capabilities  

---

## 📞 Support

If you encounter issues:

1. **Check the browser console** for error messages
2. **Use the test page** (`/test`) to isolate issues
3. **Verify network requests** in the DevTools Network tab
4. **Test the n8n endpoints directly** using curl or Postman

### Example curl command:

```bash
curl -X POST https://n8n.mediajade.com/webhook/ai-preview \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","input":"Send email to john about meeting"}'
```

---

## 🎉 Congratulations!

You now have a fully functional Aura AI frontend integrated with a powerful n8n backend workflow. Users can interact with AI-powered productivity automation through a beautiful, responsive interface!

**Next Steps:**
- Implement user authentication
- Add more sophisticated UI features
- Deploy to production
- Gather user feedback and iterate

Happy coding! 🚀
