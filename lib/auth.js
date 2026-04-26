import { cookies } from 'next/headers'

// Returns auth info from cookie
// Admin:  { isAdmin: true,  isSchool: false, schoolId: null }
// School: { isAdmin: false, isSchool: true,  schoolId: 24355 }
// Guest:  { isAdmin: false, isSchool: false, schoolId: null }
export function getAuthInfo() {
  const cookieStore = cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return { isAdmin: false, isSchool: false, schoolId: null }

  if (token === 'admin') {
    return { isAdmin: true, isSchool: false, schoolId: null }
  }

  if (token.startsWith('school:')) {
    const schoolId = parseInt(token.split(':')[1])
    return { isAdmin: false, isSchool: true, schoolId }
  }

  // Legacy support for old 'authenticated' token
  if (token === 'authenticated') {
    return { isAdmin: true, isSchool: false, schoolId: null }
  }

  return { isAdmin: false, isSchool: false, schoolId: null }
}

export function isAuthenticated() {
  const { isAdmin, isSchool } = getAuthInfo()
  return isAdmin || isSchool
}

export function canEditSchool(schoolId) {
  const { isAdmin, isSchool, schoolId: authSchoolId } = getAuthInfo()
  if (isAdmin) return true
  if (isSchool && authSchoolId === schoolId) return true
  return false
}
