interface TableUsersProps {
  teste: string;
}

export function TableUsers({ teste }: TableUsersProps) {
  return (
    <div>
      <span>{teste}</span>
    </div>
  );
}
