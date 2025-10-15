# Delete Document Upload - User Endpoint

## ✅ New Feature Added

Users can now **permanently delete** their document uploads if they are not yet processed by admin.

---

## 🔌 Endpoint

```
DELETE /api/documents/:id/delete
```

**Access**: User, Dealer  
**Authentication**: Required

---

## 📝 When Can Users Delete?

### ✅ **Can Delete When:**
- Status is **"Pending-Review"** (just uploaded, not yet reviewed)
- Status is **"Rejected"** (admin rejected the document)
- Status is **"Cancelled"** (user already cancelled it)

### ❌ **Cannot Delete When:**
- Status is **"Order-Created"** → Order already created, contact support
- Status is **"Under-Review"** → Admin is reviewing, cancel instead
- Status is **"Contacted"** → Admin contacted customer, cancel instead

---

## 🆚 Delete vs Cancel

| Action | What Happens | When to Use |
|--------|--------------|-------------|
| **Cancel** | Sets status to "Cancelled", document remains in database | When admin is reviewing or you want to keep history |
| **Delete** | Permanently removes document from database | When document is pending or rejected and you want to remove it completely |

---

## 📤 Request

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | String | ✅ Yes | User ID (must match document owner) |

### cURL Example

```bash
curl -X DELETE "http://localhost:5003/api/documents/671234567890abcdef123456/delete?user_id=66f4a1b2c3d4e5f6a7b8c9d0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✅ Success Response (200)

```json
{
  "success": true,
  "data": null,
  "message": "Document deleted successfully"
}
```

---

## ❌ Error Responses

### 400 - Missing user_id
```json
{
  "success": false,
  "message": "user_id is required"
}
```

### 403 - Not Document Owner
```json
{
  "success": false,
  "message": "You can only delete your own documents"
}
```

### 404 - Document Not Found
```json
{
  "success": false,
  "message": "Document not found"
}
```

### 400 - Order Already Created
```json
{
  "success": false,
  "message": "Cannot delete - order has already been created from this document. Please contact support."
}
```

### 400 - Under Review
```json
{
  "success": false,
  "message": "Cannot delete - document is currently being reviewed by admin. Please cancel instead or contact support."
}
```

---

## 🔄 Delete Logic Flow

```
User requests delete
    ↓
Check if user owns document → NO → 403 Forbidden
    ↓ YES
Check status:
    ├─ "Order-Created" → 400 Cannot Delete (order exists)
    ├─ "Under-Review" → 400 Cannot Delete (use cancel)
    ├─ "Contacted" → 400 Cannot Delete (use cancel)
    ├─ "Pending-Review" → ✅ Delete
    ├─ "Rejected" → ✅ Delete
    └─ "Cancelled" → ✅ Delete
    ↓
Document permanently deleted from database
    ↓
Success response
```

---

## 💻 JavaScript/Axios Example

```javascript
const deleteDocumentUpload = async (documentId, userId) => {
  try {
    const response = await axios.delete(
      `http://localhost:5003/api/documents/${documentId}/delete?user_id=${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    if (response.data.success) {
      console.log('✅ Document deleted successfully');
      // Redirect or refresh document list
      window.location.href = '/my-documents';
    }
  } catch (error) {
    if (error.response?.status === 400) {
      // Cannot delete - show specific message
      alert(error.response.data.message);
    } else if (error.response?.status === 403) {
      alert('You can only delete your own documents');
    } else {
      alert('Failed to delete document');
    }
  }
};
```

---

## 🎨 React Component Example

```jsx
const DocumentCard = ({ document, userId, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if document can be deleted
  const canDelete = () => {
    const deletableStatuses = ['Pending-Review', 'Rejected', 'Cancelled'];
    return deletableStatuses.includes(document.status);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this document?')) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await axios.delete(
        `/api/documents/${document._id}/delete?user_id=${userId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Document deleted successfully');
        onDelete(document._id); // Callback to remove from list
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="document-card">
      <h3>{document.document_number}</h3>
      <p>{document.description}</p>
      <span className={`status ${document.status}`}>
        {document.status}
      </span>

      {canDelete() ? (
        <button 
          onClick={handleDelete} 
          disabled={isDeleting}
          className="btn-delete"
        >
          {isDeleting ? 'Deleting...' : 'Delete Document'}
        </button>
      ) : (
        <button onClick={() => handleCancel(document._id)} className="btn-cancel">
          Cancel Document
        </button>
      )}
    </div>
  );
};
```

---

## 🎯 User Flow Examples

### Example 1: User Uploaded Wrong Document
```
User uploads document → Realizes it's wrong
    ↓
Status: "Pending-Review"
    ↓
User clicks "Delete" → Document permanently removed ✅
```

### Example 2: Document Rejected by Admin
```
Admin rejects document → Status: "Rejected"
    ↓
User sees rejection
    ↓
User deletes rejected document ✅
```

### Example 3: Document Under Review
```
Admin reviewing document → Status: "Under-Review"
    ↓
User tries to delete → ❌ Error: "Cannot delete - under review"
    ↓
User can cancel instead (sets status to "Cancelled")
```

### Example 4: Order Already Created
```
Admin created order → Status: "Order-Created"
    ↓
User tries to delete → ❌ Error: "Order exists, contact support"
    ↓
User must contact support for order cancellation
```

---

## 🔒 Security Features

1. ✅ **Ownership Check**: Users can only delete their own documents
2. ✅ **Status Validation**: Prevents deletion of processed documents
3. ✅ **Order Protection**: Cannot delete if order was created
4. ✅ **Audit Logging**: All deletions are logged for tracking
5. ✅ **Authentication Required**: Must be authenticated user

---

## 📊 Comparison: Cancel vs Delete

### **Cancel** (`PATCH /api/documents/:id/cancel`)
```
✅ Sets status to "Cancelled"
✅ Document remains in database
✅ Admin can still see it
✅ History is preserved
✅ Can be used anytime before order creation
```

**Use When**: You want to stop processing but keep record

### **Delete** (`DELETE /api/documents/:id/delete`)
```
✅ Permanently removes from database
✅ Document completely gone
✅ Cannot be recovered
✅ Only works if not being processed
```

**Use When**: You want to completely remove the document

---

## 🎨 UI Button Logic

```javascript
const renderActionButton = (document) => {
  const { status } = document;

  // Show delete button for deletable statuses
  if (['Pending-Review', 'Rejected', 'Cancelled'].includes(status)) {
    return (
      <button onClick={() => deleteDocument(document._id)}>
        🗑️ Delete Document
      </button>
    );
  }

  // Show cancel button for cancelable statuses
  if (['Under-Review', 'Contacted'].includes(status)) {
    return (
      <button onClick={() => cancelDocument(document._id)}>
        ❌ Cancel Request
      </button>
    );
  }

  // Order created - cannot delete or cancel
  if (status === 'Order-Created') {
    return (
      <button disabled>
        ✅ Order Created (Contact Support)
      </button>
    );
  }
};
```

---

## 📝 API Summary

| Endpoint | Method | Purpose | When to Use |
|----------|--------|---------|-------------|
| `/api/documents/:id/cancel` | PATCH | Cancel document | When being reviewed, want to keep history |
| `/api/documents/:id/delete` | DELETE | Permanently delete | When pending/rejected, want to remove completely |

---

## ✅ Benefits

1. ✅ **User Control**: Users can remove unwanted uploads
2. ✅ **Database Cleanup**: Removes clutter from pending/rejected documents
3. ✅ **Privacy**: Users can delete documents they don't want stored
4. ✅ **Safety**: Prevents deletion of important processed documents
5. ✅ **Flexibility**: Gives users choice between cancel and delete

---

## 🚀 Implementation Complete

The delete endpoint is now live and ready to use!

- ✅ Controller function added
- ✅ Route registered
- ✅ Audit logging enabled
- ✅ Security checks in place
- ✅ No linting errors
- ✅ Documentation complete

---

**Use DELETE for permanent removal, CANCEL for keeping history!** 🎉
