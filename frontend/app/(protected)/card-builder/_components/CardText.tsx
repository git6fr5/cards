interface CardTextProps {
  text: string;
}

export default function CardText({ text }: CardTextProps) {
  return (
    <div className="flex-1 overflow-hidden px-[3mm] pb-[1mm] pt-[2mm]">
      <p className="font-garamond text-xs leading-normal text-kingkiller-white/90 whitespace-pre-line">{text}</p>
    </div>
  );
}
