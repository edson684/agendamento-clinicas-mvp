/** Autorização CONTEXTUAL: o papel não basta — é preciso vínculo legítimo com o paciente. */
export const canAccessClinical = ({ hasRelationship }) => hasRelationship === true;
