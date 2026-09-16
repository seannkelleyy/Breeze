'use client';
import PeopleCard from '../PeopleCard';

interface PeopleSectionProps {
  isCollapsed: boolean;
}

export function PeopleSection({ isCollapsed }: PeopleSectionProps) {
  return <PeopleCard collapsed={isCollapsed} />;
}

export default PeopleSection;
