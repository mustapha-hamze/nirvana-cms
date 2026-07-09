import { TextField, TextAreaField } from '../ui/FormField'

// Content's always-visible primary fields — Title/Headline/Abstract, shown
// regardless of create vs. edit (unlike Body/Categories/Tags/SEO below them).
export default function ContentMainFields({
  title,
  headline,
  abstract,
  onChangeTitle,
  onChangeHeadline,
  onChangeAbstract,
  isRtl,
}: {
  title: string
  headline: string
  abstract: string
  onChangeTitle: (value: string) => void
  onChangeHeadline: (value: string) => void
  onChangeAbstract: (value: string) => void
  isRtl: boolean
}) {
  return (
    <>
      <TextField label="Title" required value={title} onChange={onChangeTitle} dir={isRtl ? 'rtl' : 'ltr'} />
      <TextField label="Headline" value={headline} onChange={onChangeHeadline} dir={isRtl ? 'rtl' : 'ltr'} />
      <TextAreaField label="Abstract" value={abstract} onChange={onChangeAbstract} dir={isRtl ? 'rtl' : 'ltr'} />
    </>
  )
}
