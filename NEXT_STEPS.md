# Next Steps for The Long Rest VTT

## 🚨 Critical Fixes & Testing (Do First!)

### 1. Fix Session View Map Handling
- [ ] Fix the map upload UI integration (currently has duplicate conditional)
- [ ] Ensure map upload works when no map exists
- [ ] Test map image serving from `/api/uploads`

### 2. Database & Persistence
- [ ] **Initiative Tracker**: Currently only in-memory, needs database persistence
  - Create Initiative model or add to Token model
  - Save initiative values when set
  - Load initiative on session start
- [ ] Test all CRUD operations work correctly
- [ ] Verify real-time updates persist correctly

### 3. Error Handling & Validation
- [ ] Add error boundaries to React components
- [ ] Improve error messages for users
- [ ] Validate file uploads (size limits, file types)
- [ ] Handle SSE connection failures gracefully

### 4. Testing
- [ ] Test with multiple users simultaneously
- [ ] Test token movement sync
- [ ] Test chat real-time updates
- [ ] Test fog of war reveal
- [ ] Test drawing tools
- [ ] Test spell effect placement
- [ ] Test dice rolling and chat integration

---

## 🎯 High-Value Quick Wins

### 5. Token Image Uploads
- [ ] Add image upload to token creation
- [ ] Display token images on canvas
- [ ] Allow updating token images

### 6. Initiative Persistence
- [ ] Add initiative field to Token model (or separate Initiative model)
- [ ] Save initiative values to database
- [ ] Load initiative on session start
- [ ] Sync initiative changes in real-time

### 7. Better Token Management
- [ ] Token properties panel (edit vision radius, darkvision, size)
- [ ] Link character to token from character panel
- [ ] Bulk token operations (DM only)

### 8. Map Upload Improvements
- [ ] Show upload progress
- [ ] Validate image dimensions match input
- [ ] Preview map before upload
- [ ] Better error messages for upload failures

---

## 🚀 Deployment Preparation

### 9. Environment Setup
- [ ] Set up production database (PostgreSQL)
- [ ] Configure environment variables
- [ ] Set up file storage (S3/R2/Vercel Blob)
- [ ] Configure CORS if needed

### 10. Performance
- [ ] Optimize image serving (CDN, compression)
- [ ] Add pagination for large token lists
- [ ] Optimize canvas rendering for large maps
- [ ] Add loading states everywhere

### 11. Security
- [ ] Review all access control checks
- [ ] Validate file uploads server-side
- [ ] Rate limiting for API endpoints
- [ ] Input sanitization

---

## 🎨 Polish & UX Improvements

### 12. UI/UX Enhancements
- [ ] Loading skeletons for async data
- [ ] Toast notifications for actions
- [ ] Keyboard shortcuts (spacebar for dice, etc.)
- [ ] Better mobile responsiveness
- [ ] Tooltips for buttons
- [ ] Confirmation dialogs for destructive actions

### 13. Character Sheet
- [ ] Basic character sheet modal/page
- [ ] HP, AC, stats display
- [ ] Quick edit capabilities
- [ ] Character notes field

### 14. Session Management
- [ ] Session notes/recap field
- [ ] Session history view
- [ ] Export session data

---

## 🔮 Future Enhancements (Nice to Have)

### 15. Advanced Features
- [ ] Map library (reuse maps across sessions)
- [ ] Roll history sidebar
- [ ] Effect templates
- [ ] Effect duration timers
- [ ] Player invitation system
- [ ] Campaign journal/notes
- [ ] Co-DM support
- [ ] Observer mode

### 16. Mobile Optimization
- [ ] Touch gestures for map pan/zoom
- [ ] Mobile-friendly token panel
- [ ] Responsive chat panel
- [ ] Mobile drawing tools

---

## 📋 Recommended Order

**Week 1: Critical Fixes**
1. Fix session view map handling
2. Add initiative persistence
3. Test everything with multiple users
4. Fix any bugs found

**Week 2: Quick Wins**
5. Token image uploads
6. Better token management UI
7. Map upload improvements
8. Error handling improvements

**Week 3: Deployment**
9. Set up production environment
10. Performance optimizations
11. Security review
12. Deploy!

**Week 4+: Polish**
13. UI/UX improvements
14. Character sheets
15. Future enhancements as needed

---

## 🐛 Known Issues to Fix

1. **Session View**: Map upload UI needs proper integration
2. **Initiative**: Not persisted to database
3. **File Uploads**: Using base64 (inefficient for large files)
4. **Error Handling**: Could be more user-friendly
5. **Mobile**: Not optimized for mobile devices

---

## 💡 Quick Fixes You Can Do Now

1. **Fix the duplicate conditional in session-view.tsx** (line 135-136)
2. **Add initiative persistence** - Create a simple Initiative model or add to Token
3. **Test the app** - Run `npm run dev` and test with multiple browser windows
4. **Add loading states** - Show spinners while data loads
5. **Add error messages** - Display user-friendly errors

---

*This roadmap prioritizes getting the VTT production-ready, then adding polish and enhancements.*

