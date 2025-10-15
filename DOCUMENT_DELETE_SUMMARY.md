# Document Delete Endpoint - Quick Summary

## ✅ New Endpoint Added

Users can now **permanently delete** their document uploads from the database.

---

## 🔌 Endpoint Details

```
DELETE /api/documents/:id/delete?user_id=USER_ID
```

**Access**: User, Dealer  
**Authentication**: Required  
**Query Parameter**: `user_id` (required)

---

## ⚡ Quick Usage

### cURL
```bash
curl -X DELETE "http://localhost:5003/api/documents/DOC_ID/delete?user_id=USER_ID" \
  -H "Authorization: Bearer TOKEN"
```

### JavaScript
```javascript
await axios.delete(`/api/documents/${docId}/delete?user_id=${userId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## ✅ Can Delete When:
- ✅ Status: **"Pending-Review"** (just uploaded)
- ✅ Status: **"Rejected"** (admin rejected)
- ✅ Status: **"Cancelled"** (already cancelled)

## ❌ Cannot Delete When:
- ❌ Status: **"Order-Created"** (order exists)
- ❌ Status: **"Under-Review"** (admin reviewing)
- ❌ Status: **"Contacted"** (admin contacted customer)

---

## 🆚 Delete vs Cancel

| Feature | **Delete** | **Cancel** |
|---------|------------|------------|
| Endpoint | `DELETE /:id/delete` | `PATCH /:id/cancel` |
| Result | Permanently removed | Status → "Cancelled" |
| Database | Document deleted | Document kept |
| Recoverable | ❌ No | ✅ Yes (in database) |
| When | Pending/Rejected | Any status before order |

---

## 📝 Response

### Success (200)
```json
{
  "success": true,
  "data": null,
  "message": "Document deleted successfully"
}
```

### Error (400/403/404)
```json
{
  "success": false,
  "message": "Error message here"
}
```

---

## 🔒 Security

- ✅ User can only delete their own documents
- ✅ Cannot delete if order was created
- ✅ Cannot delete if under admin review
- ✅ All deletions are audit logged

---

## 📁 Files Modified

1. ✅ `services/order-service/src/controllers/documentUpload.js`
   - Added `deleteDocumentUpload` function

2. ✅ `services/order-service/src/routes/documentUpload.js`
   - Added `DELETE /:id/delete` route

3. ✅ `DOCUMENT_DELETE_ENDPOINT.md`
   - Complete documentation

4. ✅ `DOCUMENT_DELETE_SUMMARY.md` (this file)
   - Quick reference

---

## 🎯 Use Cases

1. **Uploaded Wrong File**: User can delete and re-upload
2. **Rejected Document**: User can remove rejected requests
3. **Changed Mind**: User can delete pending requests
4. **Privacy**: User can remove documents they don't want stored

---

## ✨ Key Points

- 🗑️ **Permanent deletion** from database
- 🔒 **Security checks** prevent unauthorized deletion
- 📋 **Status-based** logic prevents deletion of important documents
- 📝 **Audit logging** tracks all deletions
- ✅ **No linting errors**

---

**The delete endpoint is production-ready and safe to use!** 🚀
