# 🔍 Email Debugging Checklist

Use this checklist to debug email issues step by step.

## ✅ Step 1: Verify Backend is Running
```bash
ps aux | grep "node.*server.js" | grep -v grep
```
**Expected:** Should show running node process  
**If not:** Start backend with `cd Backend && npm start`

---

## ✅ Step 2: Verify AWS SES Configuration
```bash
cd Backend
node -e "require('dotenv').config(); console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Missing'); console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Missing'); console.log('SES_FROM_EMAIL:', process.env.SES_FROM_EMAIL);"
```
**Expected:**
```
AWS_ACCESS_KEY_ID: Set
AWS_SECRET_ACCESS_KEY: Set
SES_FROM_EMAIL: connect@truviews.in
```

---

## ✅ Step 3: Test Email Sending Directly
```bash
cd Backend
node test-email-quick.js your-email@gmail.com
```
**Expected:**
```
✅ SUCCESS! Email sent
📬 Message ID: 01090199...
```

**If fails:** Check the error message for clues

---

## ✅ Step 4: Check Backend Logs When Registering

1. **Restart Backend First!**
   ```bash
   # In backend terminal: Ctrl+C then
   npm start
   ```

2. **Try to register in the UI**

3. **Watch backend terminal - should see:**
   ```
   ======================================================================
   📝 REGISTRATION REQUEST RECEIVED
   ======================================================================
   Request body: { ... }
   
   📧 ATTEMPTING TO SEND VERIFICATION EMAIL
     To: user@example.com
     OTP: 123456
     Name: John
   📬 Email Result: { "success": true, ... }
   ✅ Verification email sent successfully!
   ```

4. **If you see NO logs at all:**
   - ❌ Backend not restarted with new code
   - ❌ Frontend not reaching backend
   - ❌ CORS issue
   - ❌ Wrong backend URL in frontend

5. **If you see logs but email fails:**
   - Check the error in "Email Result"
   - Look for AWS error codes
   - Verify AWS credentials

---

## ✅ Step 5: Check Frontend Network Requests

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to register
4. Look for request to `/api/auth/register`

**Expected:**
- Status: 201 (success)
- Response body contains: `userId`, `email`, `firstName`

**If 500 error:**
- Check backend logs for the error
- Email sending likely failed

**If no request appears:**
- Frontend validation blocking submission
- Check browser console for errors

---

## ✅ Step 6: Verify Email Delivery

1. **Check AWS SES Console:**
   - https://ap-south-1.console.aws.amazon.com/ses/home
   - Go to "Sending statistics"
   - Should show recent sends

2. **Check email inbox:**
   - Primary inbox
   - Spam/Junk folder
   - Promotions tab (Gmail)

3. **Email delay:**
   - Usually instant (< 5 seconds)
   - Can take up to 1-2 minutes sometimes

---

## 🚨 Common Issues & Solutions

### Issue: "No logs appear in backend"
**Solution:** Restart backend server - it's running old code!

### Issue: "Resolved credential object is not valid"
**Solution:** Already fixed! Just restart backend.

### Issue: "Email sent successfully but not received"
**Solutions:**
1. Check spam folder
2. Verify email address is correct
3. Check AWS SES sending statistics
4. Email might be delayed (wait 2-3 minutes)

### Issue: "MessageRejected error"
**Solutions:**
1. Check if still in sandbox mode (shouldn't be - you have production access)
2. Verify FROM email is correct in .env
3. Check AWS SES verified identities

### Issue: "Frontend shows 'OTP sent' but backend shows error"
**Solution:** This was a bug, now fixed. Email failures will show proper error.

---

## 📊 Quick Status Check

Run this to see all status at once:
```bash
cd Backend

echo "=== BACKEND STATUS ==="
ps aux | grep "node.*server.js" | grep -v grep | wc -l | xargs -I {} echo "Backend running: {}"

echo -e "\n=== AWS SES CONFIG ==="
node -e "require('dotenv').config(); console.log('AWS Region:', process.env.AWS_REGION); console.log('From Email:', process.env.SES_FROM_EMAIL); console.log('Templates:', process.env.SES_VERIFICATION_TEMPLATE ? 'Configured' : 'Not configured');"

echo -e "\n=== EMAIL SERVICE TEST ==="
node test-email-quick.js test@example.com 2>&1 | grep -E "SUCCESS|FAILED"
```

---

## 🎯 Final Checklist

Before contacting support, verify:

- [ ] Backend server is restarted
- [ ] AWS credentials are in .env file
- [ ] `test-email-quick.js` sends successfully
- [ ] Backend logs show registration attempts
- [ ] AWS SES console shows email sends
- [ ] Checked spam folder
- [ ] Waited 2-3 minutes for email

If all checked and still no email:
1. Check AWS CloudWatch logs
2. Verify email service quota in AWS SES
3. Contact AWS support for SES issues

