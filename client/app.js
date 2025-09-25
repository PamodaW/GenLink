(function () {
  const h = React.createElement;

  // -----------------------------
  // Small hooks/utilities
  // -----------------------------
  function useInput(initial) {
    const s = React.useState(initial);
    return { value: s[0], onChange: e => s[1](e.target.value), set: s[1] };
  }

  function nameById(persons, id) {
    const p = persons.find(x => String(x.id) === String(id));
    return p ? p.full_name : '(unknown)';
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid date
    return date.toISOString().split('T')[0]; // Returns yyyy-mm-dd format
  }

  // -----------------------------
  // Auth views
  // -----------------------------
  function Login({ onSuccess, go }) {
    const email = useInput('');
    const password = useInput('');
    const [err, setErr] = React.useState('');

    async function submit(e) {
      e.preventDefault();
      try {
        const data = await api('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: email.value, password: password.value })
        });
        setToken(data.token);
        onSuccess();
      } catch (e) { setErr(e.message); }
    }

    return h('div', { className: 'card' },
      h('h2', null, 'Login'),
      err && h('p', { className: 'error' }, err),
      h('form', { onSubmit: submit, style: { display: 'flex', flexDirection: 'column', gap: '15px' } },
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: '5px' } },
          h('label', { style: { fontWeight: 'bold', color: '#374151' } }, 'Email'),
          h('input', {
            placeholder: 'Enter your email',
            type: 'email',
            required: true,
            value: email.value,
            onChange: email.onChange,
            style: { padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }
          })
        ),
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: '5px' } },
          h('label', { style: { fontWeight: 'bold', color: '#374151' } }, 'Password'),
          h('input', {
            placeholder: 'Enter your password',
            type: 'password',
            required: true,
            value: password.value,
            onChange: password.onChange,
            style: { padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }
          })
        ),
        h('div', { style: { display: 'flex', gap: '10px', marginTop: '5px' } },
          h('button', { type: 'submit', className: 'btn btn-primary' }, 'Login'),
          h('button', { type: 'button', className: 'btn btn-secondary', onClick: () => go('signup') }, 'Go to Sign up')
        )
      )
    );
  }

  function Signup({ onSuccess, go }) {
    const email = useInput('');
    const password = useInput('');
    const [profilePicture, setProfilePicture] = React.useState('');
    const [err, setErr] = React.useState('');

    function handleImageChange(e) {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          setErr('Profile picture must be less than 5MB');
          return;
        }
        if (!file.type.startsWith('image/')) {
          setErr('Please select an image file');
          return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
          setProfilePicture(event.target.result);
          setErr('');
        };
        reader.readAsDataURL(file);
      }
    }

    async function submit(e) {
      e.preventDefault();
      try {
        const data = await api('/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            email: email.value,
            password: password.value,
            profile_picture: profilePicture
          })
        });
        setToken(data.token);
        onSuccess();
      } catch (e) { setErr(e.message); }
    }

    return h('div', { className: 'card' },
      h('h2', null, 'Sign up'),
      err && h('p', { className: 'error' }, err),
      h('form', { onSubmit: submit, style: { display: 'flex', flexDirection: 'column', gap: '15px' } },
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: '5px' } },
          h('label', { style: { fontWeight: 'bold', color: '#374151' } }, 'Email'),
          h('input', {
            placeholder: 'Enter your email',
            type: 'email',
            required: true,
            value: email.value,
            onChange: email.onChange,
            style: { padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }
          })
        ),
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: '5px' } },
          h('label', { style: { fontWeight: 'bold', color: '#374151' } }, 'Password'),
          h('input', {
            placeholder: 'Enter your password (min 6 characters)',
            type: 'password',
            required: true,
            minLength: 6,
            value: password.value,
            onChange: password.onChange,
            style: { padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }
          })
        ),
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: '5px' } },
          h('label', { style: { fontWeight: 'bold', color: '#374151' } }, 'Profile Picture (Optional)'),
          h('input', {
            type: 'file',
            accept: 'image/*',
            onChange: handleImageChange,
            style: { padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb' }
          }),
          profilePicture && h('div', { style: { marginTop: '10px', textAlign: 'center' } },
            h('img', {
              src: profilePicture,
              style: {
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #e5e7eb'
              },
              alt: 'Profile preview'
            })
          )
        ),
        h('div', { style: { display: 'flex', gap: '10px', marginTop: '5px' } },
          h('button', { type: 'submit', className: 'btn btn-primary' }, 'Create account'),
          h('button', { type: 'button', className: 'btn btn-secondary', onClick: () => go('login') }, 'Go to Login')
        )
      )
    );
  }

  // -----------------------------
  // User Profile Component
  // -----------------------------
  function UserProfile({ user }) {
    if (!user) return null;

    const profileStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 16px',
      backgroundColor: '#FFD60A',
      borderRadius: '8px',
      border: '2px solid #000000',
      boxShadow: '0 2px 8px rgba(255, 214, 10, 0.3)'
    };

    const imageStyle = {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      objectFit: 'cover',
      backgroundColor: '#e2e8f0',
      border: '2px solid #000000'
    };

    const textStyle = {
      fontSize: '15px',
      fontWeight: '600',
      color: '#000000',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
    };

    return h('div', { style: profileStyle },
      user.profile_picture
        ? h('img', { src: user.profile_picture, alt: 'Profile', style: imageStyle })
        : h('div', {
            style: {
              ...imageStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#000000',
              color: '#FFD60A',
              fontSize: '16px',
              fontWeight: 'bold'
            }
          }, user.email ? user.email.charAt(0).toUpperCase() : '?'),
      h('span', { style: textStyle }, user.email)
    );
  }

  // -----------------------------
  // Lists
  // -----------------------------
function PersonsList({ persons, onDelete }) {
  return h('div', { className: 'card' },
    h('h3', null, 'Family Members'),
    persons.length === 0
      ? h('p', { className: 'empty-state' }, 'No members yet.')
      : h('table', { className: 'data-table' },
          h('thead', null, h('tr', null,
            h('th', null, 'ID'),
            h('th', null, 'Picture'),
            h('th', null, 'Name'),
            h('th', null, 'Gender'),
            h('th', null, 'Birthdate'),
            h('th', null, 'Actions')
          )),
          h('tbody', null, persons.map(p => h('tr', { key: p.id },
            h('td', null, String(p.id)),
            h('td', null,
              p.profile_picture
                ? h('img', {
                    src: p.profile_picture,
                    style: {
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    },
                    alt: `${p.full_name}'s profile`
                  })
                : h('div', {
                    style: {
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }
                  }, '')
            ),
            h('td', null, p.full_name),
            h('td', null, p.gender),
            h('td', null, formatDate(p.birthdate) || '-'),
            h('td', null,
              h('button', {
                className: 'btn-delete',
                onClick: () => {
                  if (confirm(`Are you sure you want to delete ${p.full_name}? This will also remove all their relationships.`)) {
                    onDelete(p.id, 'person');
                  }
                },
                title: 'Delete person'
              }, 'Delete')
            )
          )))
        )
  );
}


function RelationshipsList({ relationships, persons, onDelete }) {
  return h('div', { className: 'card' },
    h('h3', null, 'Relationships'),
    relationships.length === 0
      ? h('p', { className: 'empty-state' }, 'No relationships yet.')
      : h('table', { className: 'data-table' },
          h('thead', null, h('tr', null,
            h('th', null, 'Person'),
            h('th', null, 'Related'),
            h('th', null, 'Type'),
            h('th', null, 'Actions')
          )),
          h('tbody', null, relationships.map(r => {
            const a = nameById(persons, r.person_id);
            const b = nameById(persons, r.related_person_id);
            return h('tr', { key: r.id },
              h('td', null,
                a,
                ' ',
                h('small', { style: { opacity: .6 } }, `(#${r.person_id})`)
              ),
              h('td', null,
                b,
                ' ',
                h('small', { style: { opacity: .6 } }, `(#${r.related_person_id})`)
              ),
              h('td', null, r.relation_type),
              h('td', null,
                h('button', {
                  className: 'btn-delete',
                  onClick: () => {
                    if (confirm(`Are you sure you want to delete the relationship between ${a} and ${b}?`)) {
                      onDelete(r.id, 'relationship');
                    }
                  },
                  title: 'Delete relationship'
                }, 'Delete')
              )
            );
          }))
        )
  );
}

  // -----------------------------
  // Picker: link by name (keeps IDs under the hood)
  // -----------------------------
  function PersonPicker({ persons, value, onChange, placeholder }) {
    const [q, setQ] = React.useState('');
    const filtered = React.useMemo(() => {
      const s = (q || '').toLowerCase();
      if (!s) return persons;
      return persons.filter(p => (p.full_name || '').toLowerCase().includes(s));
    }, [q, persons]);

    // small inline layout so both input and select are visible/compact
    const wrapStyle = { width: '260px', display: 'flex', flexDirection: 'column', gap: '8px' };

    return h('div', { className: 'form-field', style: wrapStyle },
      h('label', { className: 'form-label' }, placeholder || 'Select person'),
      h('input', {
        className: 'form-input',
        placeholder: 'Type to filter by name…',
        value: q,
        onChange: e => setQ(e.target.value)
      }),
      h('select', {
        className: 'form-input',
        value: value,
        onChange: e => onChange(e.target.value)
      },
        [h('option', { key: 'none', value: '' }, '— choose —')]
          .concat(filtered.map(p =>
            h('option', { key: p.id, value: String(p.id) }, p.full_name)
          ))
      )
    );
  }

  // -----------------------------
  // Dashboard
  // -----------------------------
function Dashboard({ onLogout }) {
  const [persons, setPersons] = React.useState([]);
  const [relationships, setRelationships] = React.useState([]);
  const [user, setUser] = React.useState(null);
  const [err, setErr] = React.useState('');

  // add person form
  const name = useInput('');
  const gender = useInput('other');
  const birthdate = useInput('');
  const [personProfilePicture, setPersonProfilePicture] = React.useState('');

  // add relationship form (IDs stored but chosen by name)
  const p1 = useInput('');
  const p2 = useInput('');
  const rtype = useInput('father');

  // user profile update form
  const [newUserProfilePicture, setNewUserProfilePicture] = React.useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false);

  async function loadAll() {
    try {
      const [ps, rs, u] = await Promise.all([api('/persons'), api('/relationships'), api('/auth/me')]);
      setPersons(ps);
      setRelationships(rs);
      setUser(u);
    } catch (e) { setErr(e.message); }
  }

  React.useEffect(() => { loadAll(); }, []);

  function handlePersonImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErr('Profile picture must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setErr('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = function(event) {
        setPersonProfilePicture(event.target.result);
        setErr('');
      };
      reader.readAsDataURL(file);
    }
  }

  async function addPerson(e) {
    e.preventDefault();
    try {
      await api('/persons', {
        method: 'POST',
        body: JSON.stringify({
          full_name: name.value,
          gender: gender.value,
          birthdate: birthdate.value || null,
          profile_picture: personProfilePicture || null
        })
      });
      name.set(''); gender.set('other'); birthdate.set(''); setPersonProfilePicture('');
      loadAll();
    } catch (e) { setErr(e.message); }
  }

  async function addRelationship(e) {
    e.preventDefault();
    try {
      await api('/relationships', {
        method: 'POST',
        body: JSON.stringify({
          person_id: Number(p1.value),
          related_person_id: Number(p2.value),
          relation_type: rtype.value
        })
      });
      p1.set(''); p2.set(''); rtype.set('father');
      loadAll();
    } catch (e) { setErr(e.message); }
  }

  // NEW: Delete function
  async function handleDelete(id, type) {
    try {
      if (type === 'person') {
        await api(`/persons/${id}`, { method: 'DELETE' });
      } else if (type === 'relationship') {
        await api(`/relationships/${id}`, { method: 'DELETE' });
      }
      loadAll(); // Refresh the data
    } catch (e) {
      setErr(`Failed to delete ${type}: ${e.message}`);
    }
  }

  function handleUserImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErr('Profile picture must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setErr('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = function(event) {
        setNewUserProfilePicture(event.target.result);
        setErr('');
      };
      reader.readAsDataURL(file);
    }
  }

  async function updateUserProfile(e) {
    e.preventDefault();
    if (!newUserProfilePicture) return;

    setIsUpdatingProfile(true);
    try {
      await api('/auth/update-profile', {
        method: 'PUT',
        body: JSON.stringify({
          profile_picture: newUserProfilePicture
        })
      });
      setNewUserProfilePicture('');
      loadAll(); // Refresh to get updated user data
      setErr('Profile updated successfully!');
      setTimeout(() => setErr(''), 3000); // Clear success message after 3 seconds
    } catch (e) {
      setErr(`Failed to update profile: ${e.message}`);
    }
    setIsUpdatingProfile(false);
  }

  return h('div', null,
    // Error display only
    err && h('div', { className: 'card' },
      h('p', { className: 'error' }, err)
    ),

    // update profile section
    h('div', { className: 'card' },
      h('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }
      },
        h('h3', { style: { fontSize: '18px', fontWeight: '600', color: '#FFD60A', margin: 0 } }, 'Update My Profile'),
        h('div', {
          style: {
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }
        },
          h(UserProfile, { user }),
          h('button', {
            className: 'btn btn-secondary',
            onClick: loadAll,
            style: { padding: '8px 16px', fontSize: '14px' }
          }, 'Refresh'),
          h('button', {
            className: 'btn btn-primary',
            onClick: () => { clearToken(); onLogout(); },
            style: { padding: '8px 16px', fontSize: '14px' }
          }, 'Logout')
        )
      ),
      h('form', {
        onSubmit: updateUserProfile,
        style: {
          display: 'grid',
          gridTemplateColumns: newUserProfilePicture ? '1fr 200px' : '1fr',
          gap: '20px',
          alignItems: 'start'
        }
      },
        // Left side - Form fields
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }
        },
          // Profile Picture Upload
          h('div', {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }
          },
            h('label', {
              style: {
                fontSize: '14px',
                fontWeight: '600',
                color: '#FFD60A'
              }
            }, 'Update Profile Picture'),
            h('input', {
              type: 'file',
              accept: 'image/*',
              onChange: handleUserImageChange,
              style: {
                padding: '10px',
                fontSize: '14px',
                borderRadius: '6px',
                border: '2px solid #333333',
                backgroundColor: '#1a1a1a',
                color: '#ffffff',
                cursor: 'pointer'
              }
            })
          ),

          // Submit Button - Bottom of left side
          h('div', {
            style: {
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '8px'
            }
          },
            h('button', {
              type: 'submit',
              className: 'btn btn-primary',
              disabled: !newUserProfilePicture || isUpdatingProfile,
              style: {
                padding: '14px 40px',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '8px',
                minWidth: '160px',
                backgroundColor: !newUserProfilePicture || isUpdatingProfile ? '#666666' : '#FFD60A',
                color: '#000000',
                border: 'none',
                cursor: !newUserProfilePicture || isUpdatingProfile ? 'not-allowed' : 'pointer',
                boxShadow: !newUserProfilePicture || isUpdatingProfile ? 'none' : '0 4px 12px rgba(255, 214, 10, 0.3)',
                transition: 'all 0.2s ease',
                opacity: !newUserProfilePicture || isUpdatingProfile ? 0.6 : 1
              }
            }, isUpdatingProfile ? 'Updating...' : 'Update Profile')
          )
        ),

        // Right side - Image preview (only shows when image is selected)
        newUserProfilePicture && h('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            backgroundColor: '#2a2a2a',
            borderRadius: '12px',
            border: '2px dashed #FFD60A'
          }
        },
          h('div', {
            style: {
              fontSize: '12px',
              color: '#FFD60A',
              fontWeight: '600'
            }
          }, 'New Profile Preview'),
          h('img', {
            src: newUserProfilePicture,
            style: {
              width: '150px',
              height: '150px',
              borderRadius: '12px',
              objectFit: 'cover',
              border: '3px solid #FFD60A',
              boxShadow: '0 6px 20px rgba(255, 214, 10, 0.4)'
            },
            alt: 'New profile preview'
          })
        )
      )
    ),

    // add member
    h('div', { className: 'card' },
      h('h3', { style: { marginBottom: '16px', fontSize: '18px', fontWeight: '600', color: '#FFD60A' } }, 'Add Family Member'),
      h('form', {
        onSubmit: addPerson,
        style: {
          display: 'grid',
          gridTemplateColumns: personProfilePicture ? '1fr 200px' : '1fr',
          gap: '20px',
          alignItems: 'start'
        }
      },
        // Left side - Form fields
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }
        },
          // Full Name
          h('div', {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }
          },
            h('label', {
              style: {
                fontSize: '14px',
                fontWeight: '600',
                color: '#FFD60A'
              }
            }, 'Full Name *'),
            h('input', {
              placeholder: 'Enter full name',
              required: true,
              value: name.value,
              onChange: name.onChange,
              style: {
                padding: '12px 16px',
                fontSize: '14px',
                borderRadius: '8px',
                border: '2px solid #333333',
                backgroundColor: '#1a1a1a',
                color: '#ffffff',
                transition: 'border-color 0.2s',
                outline: 'none'
              },
              onFocus: (e) => e.target.style.borderColor = '#FFD60A',
              onBlur: (e) => e.target.style.borderColor = '#333333'
            })
          ),

          // Gender and Birth Date - Side by side
          h('div', {
            style: {
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px'
            }
          },
            h('div', {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }
            },
              h('label', {
                style: {
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FFD60A'
                }
              }, 'Gender'),
              h('select', {
                value: gender.value,
                onChange: gender.onChange,
                style: {
                  padding: '12px 16px',
                  fontSize: '14px',
                  borderRadius: '8px',
                  border: '2px solid #333333',
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
                  cursor: 'pointer'
                }
              },
                h('option', { value: 'male' }, 'Male'),
                h('option', { value: 'female' }, 'Female'),
                h('option', { value: 'other' }, 'Other')
              )
            ),

            h('div', {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }
            },
              h('label', {
                style: {
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FFD60A'
                }
              }, 'Birth Date'),
              h('input', {
                type: 'date',
                value: birthdate.value,
                onChange: birthdate.onChange,
                style: {
                  padding: '12px 16px',
                  fontSize: '14px',
                  borderRadius: '8px',
                  border: '2px solid #333333',
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
                  colorScheme: 'dark'
                }
              })
            )
          ),

          // Profile Picture Upload
          h('div', {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }
          },
            h('label', {
              style: {
                fontSize: '14px',
                fontWeight: '600',
                color: '#FFD60A'
              }
            }, 'Profile Picture'),
            h('input', {
              type: 'file',
              accept: 'image/*',
              onChange: handlePersonImageChange,
              style: {
                padding: '10px',
                fontSize: '14px',
                borderRadius: '6px',
                border: '2px solid #333333',
                backgroundColor: '#1a1a1a',
                color: '#ffffff',
                cursor: 'pointer'
              }
            })
          ),

          // Submit Button - Bottom of left side
          h('div', {
            style: {
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '8px'
            }
          },
            h('button', {
              type: 'submit',
              className: 'btn btn-primary',
              style: {
                padding: '14px 40px',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '8px',
                minWidth: '160px',
                backgroundColor: '#FFD60A',
                color: '#000000',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(255, 214, 10, 0.3)',
                transition: 'all 0.2s ease'
              }
            }, 'Add Member')
          )
        ),

        // Right side - Image preview (only shows when image is selected)
        personProfilePicture && h('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            backgroundColor: '#2a2a2a',
            borderRadius: '12px',
            border: '2px dashed #FFD60A'
          }
        },
          h('div', {
            style: {
              fontSize: '12px',
              color: '#FFD60A',
              fontWeight: '600'
            }
          }, 'Preview'),
          h('img', {
            src: personProfilePicture,
            style: {
              width: '150px',
              height: '150px',
              borderRadius: '12px',
              objectFit: 'cover',
              border: '3px solid #FFD60A',
              boxShadow: '0 6px 20px rgba(255, 214, 10, 0.4)'
            },
            alt: 'Profile preview'
          })
        )
      )
    ),

    // Updated PersonsList with delete handler
    h(PersonsList, { persons, onDelete: handleDelete }),

    // add relationship (by name)
    h('div', { className: 'card' },
      h('h3', null, 'Add Relationship'),
      h('form', { onSubmit: addRelationship },
        h(PersonPicker, {
          persons,
          value: p1.value,
          onChange: v => p1.set(v),
          placeholder: 'Select Person'
        }),
        h(PersonPicker, {
          persons,
          value: p2.value,
          onChange: v => p2.set(v),
          placeholder: 'Select Related Person'
        }),
        h('div', { className: 'form-field', style: { width: '220px' } },
          h('label', { className: 'form-label' }, 'Relationship Type'),
          h('select', { className: 'form-input', value: rtype.value, onChange: rtype.onChange },
            ['father','mother','son','daughter','spouse','sibling','other'].map(t =>
              h('option', { key: t, value: t }, t)
            )
          )
        ),
        h('div', { className: 'form-actions' },
          h('button', { type: 'submit', className: 'btn btn-primary' }, 'Link')
        )
      )
    ),

    // Updated RelationshipsList with delete handler
    h(RelationshipsList, { relationships, persons, onDelete: handleDelete })
  );
}

  // -----------------------------
  // App shell
  // -----------------------------
  function App() {
  const [view, setView] = React.useState(getToken() ? 'dash' : 'login');
  const [user, setUser] = React.useState(null);
  const go = setView;

  // Load user data when authenticated
  React.useEffect(() => {
    if (getToken()) {
      api('/auth/me')
        .then(setUser)
        .catch(() => setUser(null));
    } else {
      setUser(null);
    }
  }, [view]);

  async function handleRefresh() {
    try {
      if (view === 'dash') {
        // Trigger refresh for Dashboard
        window.location.reload();
      } else if (view === 'hierarchy') {
        // Trigger refresh for Hierarchy
        window.location.reload();
      }
    } catch (e) {
      console.error('Refresh failed:', e);
    }
  }

  function handleLogout() {
    clearToken();
    setUser(null);
    go('login');
  }

  return h('div', null,
    h('nav', {
      style: {
        padding: '12px 20px',
        background: '#121e2bff',
        borderBottom: '2px solid #FFD60A',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }
    },
      // Main navigation buttons
      h('button', {
        className: view === 'login' ? 'btn btn-primary' : 'btn btn-secondary',
        onClick: () => go('login')
      }, 'Login'),
      h('button', {
        className: view === 'signup' ? 'btn btn-primary' : 'btn btn-secondary',
        onClick: () => go('signup')
      }, 'Sign up'),
      getToken() && h('button', {
        className: view === 'dash' ? 'btn btn-primary' : 'btn btn-secondary',
        onClick: () => go('dash')
      }, 'Dashboard'),
      getToken() && h('button', {
        className: view === 'hierarchy' ? 'btn btn-primary' : 'btn btn-secondary',
        onClick: () => go('hierarchy')
      }, 'Family Tree')
    ),
    h('div', { style: { padding: '20px' } },
      view === 'login' && h(Login, { onSuccess: () => go('dash'), go }),
      view === 'signup' && h(Signup, { onSuccess: () => go('dash'), go }),
      view === 'dash' && h(Dashboard, { onLogout: () => go('login') }),
      view === 'hierarchy' && h(Hierarchy, { onLogout: () => go('login') })
    )
  );
}

  // Add this Hierarchy component to your app.js file

function Hierarchy({ onLogout }) {
  const [persons, setPersons] = React.useState([]);
  const [relationships, setRelationships] = React.useState([]);
  const [hierarchyData, setHierarchyData] = React.useState(null);
  const [user, setUser] = React.useState(null);
  const [err, setErr] = React.useState('');
  const [selectedRoot, setSelectedRoot] = React.useState('');

  async function loadAll() {
    try {
      const [ps, rs, u] = await Promise.all([api('/persons'), api('/relationships'), api('/auth/me')]);
      setPersons(ps);
      setRelationships(rs);
      setUser(u);
      if (ps.length > 0 && !selectedRoot) {
        setSelectedRoot(String(ps[0].id));
      }
    } catch (e) {
      setErr(e.message);
    }
  }

  React.useEffect(() => { 
    loadAll(); 
  }, []);

  React.useEffect(() => {
    if (persons.length > 0 && relationships.length > 0 && selectedRoot) {
      const tree = buildFamilyTree(persons, relationships, Number(selectedRoot));
      setHierarchyData(tree);
    }
  }, [persons, relationships, selectedRoot]);

  function buildFamilyTree(persons, relationships, rootId) {
    const personMap = new Map();
    persons.forEach(p => personMap.set(p.id, { ...p, children: [], parents: [], spouse: null }));

    // Process relationships
    relationships.forEach(rel => {
      const person = personMap.get(rel.person_id);
      const related = personMap.get(rel.related_person_id);
      
      if (!person || !related) return;

      switch (rel.relation_type.toLowerCase()) {
        case 'father':
        case 'mother':
          if (!related.parents.some(p => p.id === person.id)) {
            related.parents.push(person);
          }
          if (!person.children.some(c => c.id === related.id)) {
            person.children.push(related);
          }
          break;
        case 'son':
        case 'daughter':
          if (!person.parents.some(p => p.id === related.id)) {
            person.parents.push(related);
          }
          if (!related.children.some(c => c.id === person.id)) {
            related.children.push(person);
          }
          break;
        case 'spouse':
          person.spouse = related;
          related.spouse = person;
          break;
        case 'sibling':
          // For siblings, we'll handle them through common parents
          break;
      }
    });

    return personMap.get(rootId) || null;
  }

  function PersonCard({ person, level = 0 }) {
    if (!person) return null;

    const cardStyle = {
      background: level === 0 ? '#FFD60A' : level === 1 ? '#81790bff' : '#cdf007ff',
      color: 'black',
      padding: '20px',
      borderRadius: '12px',
      margin: '8px',
      minWidth: '180px',
      textAlign: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      border: '3px solid #000'
    };

    const genderIcon = person.gender === 'male' ? 'M' : person.gender === 'female' ? 'F' : 'U';

    return h('div', { style: cardStyle },
      h('div', { style: { marginBottom: '12px' } },
        person.profile_picture
          ? h('img', {
              src: person.profile_picture,
              style: {
                width: '80px',
                height: '80px',
                borderRadius: '8px',
                objectFit: 'cover',
                border: '3px solid black',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              },
              alt: `${person.full_name}'s profile`
            })
          : h('div', {
              style: {
                width: '80px',
                height: '80px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 'bold',
                border: '3px solid black',
                margin: '0 auto',
                color: '#000'
              }
            }, genderIcon)
      ),
      h('div', {
        style: {
          fontWeight: 'bold',
          fontSize: '16px',
          marginBottom: '8px',
          lineHeight: '1.2',
          wordBreak: 'break-word'
        }
      }, person.full_name),
      person.birthdate && h('div', {
        style: {
          fontSize: '14px',
          fontWeight: '600',
          opacity: 0.8,
          backgroundColor: 'rgba(0,0,0,0.1)',
          padding: '4px 8px',
          borderRadius: '4px',
          display: 'inline-block'
        }
      }, formatDate(person.birthdate))
    );
  }

  function FamilyLevel({ person, level = 0, visited = new Set() }) {
    if (!person || visited.has(person.id)) return null;
    visited.add(person.id);

    const levelStyle = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      margin: '30px 15px'
    };

    const childrenContainerStyle = {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: '30px',
      marginTop: '30px',
      flexWrap: 'wrap'
    };

    const connectionStyle = {
      width: '3px',
      height: '30px',
      background: '#FFD60A',
      margin: '0 auto'
    };

    return h('div', { style: levelStyle },
      // Current person and spouse
      h('div', { style: { display: 'flex', gap: '20px', alignItems: 'center' } },
        h(PersonCard, { person, level }),
        person.spouse && h('div', { style: { display: 'flex', alignItems: 'center', gap: '15px' } },
          h('div', {
            style: {
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#000',
              backgroundColor: '#FFD60A',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #000'
            }
          }, '♥'),
          h(PersonCard, { person: person.spouse, level })
        )
      ),
      
      // Connection line to children
      person.children && person.children.length > 0 && h('div', { style: connectionStyle }),
      
      // Children
      person.children && person.children.length > 0 && h('div', { style: childrenContainerStyle },
        person.children.map(child => 
          h(FamilyLevel, { 
            key: child.id, 
            person: child, 
            level: level + 1, 
            visited: new Set(visited) // Create new visited set for each branch
          })
        )
      )
    );
  }

  const containerStyle = {
    padding: '20px',
    background: '#080e14ff',
    minHeight: '100vh'
  };

  const treeContainerStyle = {
    background: 'white',
    border: '1px solid #020508ff',
    borderRadius: '12px',
    padding: '30px',
    overflow: 'auto',
    minHeight: '400px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start'
  };

  return h('div', { style: containerStyle },
    // Error display only
    err && h('div', { className: 'card' },
      h('p', { className: 'error' }, err)
    ),

    // Root selector
    h('div', { className: 'card' },
      h('h3', null, 'Select Family Root'),
      h('div', { style: { display: 'flex', gap: '10px', alignItems: 'center' } },
        h('label', null, 'Start hierarchy from: '),
        h('select', {
          value: selectedRoot,
          onChange: e => setSelectedRoot(e.target.value),
          style: { padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }
        },
          h('option', { value: '' }, 'Choose a person...'),
          persons.map(p => h('option', { key: p.id, value: String(p.id) }, p.full_name))
        )
      )
    ),

    // Family Tree Visualization
    h('div', { className: 'card' },
      h('h3', { style: { textAlign: 'center', marginBottom: '20px' } }, 'Family Tree'),
      h('div', { style: treeContainerStyle },
        hierarchyData ? h(FamilyLevel, { person: hierarchyData, level: 0 }) 
                     : h('p', { style: { color: '#64748b', textAlign: 'center' } }, 
                         persons.length === 0 ? 'No family members found.' : 'Select a person to view their family tree.')
      )
    ),

    // Legend
    h('div', { className: 'card' },
      h('h4', null, 'Legend'),
      h('div', { style: { display: 'flex', gap: '20px', flexWrap: 'wrap' } },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
          h('div', { style: { width: '20px', height: '20px', background: '#FFD60A', borderRadius: '4px', border: '1px solid #000' } }),
          h('span', null, 'Root Person')
        ),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
          h('div', { style: { width: '20px', height: '20px', background: '#81790bff', borderRadius: '4px', border: '1px solid #000' } }),
          h('span', null, 'Children')
        ),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
          h('div', { style: { width: '20px', height: '20px', background: '#cdf007ff', borderRadius: '4px', border: '1px solid #000' } }),
          h('span', null, 'Grandchildren+')
        ),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
          h('div', {
            style: {
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#000',
              backgroundColor: '#FFD60A',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #000'
            }
          }, '♥'),
          h('span', null, 'Married Couple')
        )
      )
    )
  );
}

  ReactDOM.createRoot(document.getElementById('app')).render(h(App));

  // (Optional) Ripple coordinates for buttons
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('button,.btn');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    btn.style.setProperty('--x', (e.clientX - r.left) + 'px');
    btn.style.setProperty('--y', (e.clientY - r.top) + 'px');
  }, { passive: true });
})();
