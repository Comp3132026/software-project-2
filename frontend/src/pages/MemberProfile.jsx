import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GroupProvider } from '../context/GroupContext';
import useGroupData from '../hooks/useGroupData';
import { computeGroupRoles } from '../utils/groupRoles';
import ProfilePage from './Profile';

export default function MemberProfilePage() {
  const { groupId, memberId } = useParams();
  const { user } = useAuth();

  const { group, members, loading } = useGroupData(groupId);

  if (loading || !group) {
    return <p>Loading...</p>;
  }

  // compute roles normally
  const roles = computeGroupRoles(group, members, user);

  return (
    <GroupProvider value={{ group, members, ...roles }}>
      <ProfilePage memberId={memberId} />
    </GroupProvider>
  );
}
