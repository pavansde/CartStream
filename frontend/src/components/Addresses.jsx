import { useState } from 'react';

// Address display component
const Address = ({ address, onSetDefault, onEdit, onDelete }) => {
  const {
    id,
    full_name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    country,
    is_default,
  } = address;

  return (
    <div style={{
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      backgroundColor: is_default ? '#e0f7fa' : '#fff'
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
        {full_name} {is_default && <span style={{color: 'green'}}> (Default) </span>}
      </div>
      <div>{phone}</div>
      <div>{address_line1}</div>
      {address_line2 && <div>{address_line2}</div>}
      <div>{city}, {state} {postal_code}</div>
      <div>{country}</div>
      
      <div style={{ marginTop: '12px' }}>
        {!is_default && (
          <button onClick={() => onSetDefault(id)} style={{ marginRight: '8px' }}>
            Set as Default
          </button>
        )}
        <button onClick={() => onEdit(id)} style={{ marginRight: '8px' }}>
          Edit
        </button>
        <button onClick={() => onDelete(id)} style={{ color: 'red' }}>
          Delete
        </button>
      </div>
    </div>
  );
};

// Address form component
const AddressForm = ({ address, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    full_name: address?.full_name || '',
    phone: address?.phone || '',
    address_line1: address?.address_line1 || '',
    address_line2: address?.address_line2 || '',
    city: address?.city || '',
    state: address?.state || '',
    postal_code: address?.postal_code || '',
    country: address?.country || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #bbb', padding: '16px', marginBottom: '20px' }}>
      <div>
        <label>
          Full Name:
          <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required />
        </label>
      </div>
      <div>
        <label>
          Phone:
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
        </label>
      </div>
      <div>
        <label>
          Address Line 1:
          <input type="text" name="address_line1" value={formData.address_line1} onChange={handleChange} required />
        </label>
      </div>
      <div>
        <label>
          Address Line 2:
          <input type="text" name="address_line2" value={formData.address_line2} onChange={handleChange} />
        </label>
      </div>
      <div>
        <label>
          City:
          <input type="text" name="city" value={formData.city} onChange={handleChange} required />
        </label>
      </div>
      <div>
        <label>
          State:
          <input type="text" name="state" value={formData.state} onChange={handleChange} required />
        </label>
      </div>
      <div>
        <label>
          Postal Code:
          <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} required />
        </label>
      </div>
      <div>
        <label>
          Country:
          <input type="text" name="country" value={formData.country} onChange={handleChange} required />
        </label>
      </div>
      <div style={{ marginTop: '12px' }}>
        <button type="submit" style={{ marginRight: '10px' }}>Save</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

// Parent component managing addresses
const AddressManager = () => {
  const [addresses, setAddresses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // For simplicity, using in-memory id generation
  const nextId = () => Math.max(0, ...addresses.map(a => a.id)) + 1;

  const handleAdd = () => {
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (id) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setAddresses(prev => prev.filter(addr => addr.id !== id));
  };

  const handleSetDefault = (id) => {
    setAddresses(prev =>
      prev.map(addr => ({
        ...addr,
        is_default: addr.id === id ? 1 : 0,
      }))
    );
  };

  const handleSave = (formData) => {
    if (editingId === null) {
      // Add new
      setAddresses(prev => [
        ...prev,
        { id: nextId(), is_default: prev.length === 0 ? 1 : 0, ...formData },
      ]);
    } else {
      // Edit existing
      setAddresses(prev =>
        prev.map(addr =>
          addr.id === editingId ? { ...addr, ...formData } : addr
        )
      );
    }
    setShowForm(false);
    setEditingId(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const editingAddress = addresses.find(a => a.id === editingId);

  return (
    <div>
      <h2>Addresses</h2>
      {!showForm && (
        <button onClick={handleAdd} style={{ marginBottom: '16px' }}>
          Add Address
        </button>
      )}
      {showForm && (
        <AddressForm
          address={editingAddress}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
      {addresses.length === 0 && !showForm && <p>No addresses added yet.</p>}
      {addresses.map(address => (
        <Address
          key={address.id}
          address={address}
          onSetDefault={handleSetDefault}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};

export default AddressManager;
