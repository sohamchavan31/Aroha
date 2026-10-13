// The user fields we cache from an auth response (login, register, reset).
export function userFromAuth(data, email) {
  return {
    name: data.name,
    email,
    evolutionStage: data.evolutionStage,
    evolutionPoints: data.evolutionPoints,
    profileComplete: data.profileComplete,
    emailVerified: data.emailVerified,
  };
}
