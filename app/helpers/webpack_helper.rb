# frozen_string_literal: true

module WebpackHelper
    def prefetch_link_tag(source)
      href = asset_path(source)
  
      link_tag = tag.link(rel: 'prefetch', href: href)
  
      early_hints_link = "<#{href}>; rel=prefetch"
  
      request.send_early_hints("Link" => early_hints_link)
  
      link_tag
    end
  
    def webpack_bundle_tag(bundle)
      javascript_include_tag(*webpack_entrypoint_paths(bundle), defer: "defer")
    end
  
    def webpack_preload_asset_tag(asset, options = {})
      path = Gitlab::Webpack::Manifest.asset_paths(asset).first
  
      if options.delete(:prefetch)
        prefetch_link_tag(path)
      else
        preload_link_tag(path, options)
      end
    rescue StandardError
      # In development/test, incremental compilation may be enabled, meaning not
      # all chunks may be available/split out
    end
  
    def webpack_controller_bundle_tags
      chunks = []
  
      action = case controller.action_name
               when 'create' then 'new'
               when 'update' then 'edit'
               else controller.action_name
               end
  
      route = [*controller.controller_path.split('/'), action].compact
  
      until chunks.any? || route.empty?
        entrypoint = "pages.#{route.join('.')}"
        begin
          chunks = webpack_entrypoint_paths(entrypoint, extension: 'js')
        rescue StandardError
          # no bundle exists for this path
        end
        route.pop
      end
  
      if chunks.empty?
        chunks = webpack_entrypoint_paths("default", extension: 'js')
      end
  
      javascript_include_tag(*chunks, defer: "defer")
    end
  
    def webpack_entrypoint_paths(source, extension: nil, exclude_duplicates: true)
      return "" unless source.present?
  
      paths = entrypoint_paths(source)
      if extension
        paths.select! { |p| p.ends_with? ".#{extension}" }
      end
  
      force_host = webpack_public_host
      if force_host
        paths.map! { |p| "#{force_host}#{p}" }
      end
  
      if exclude_duplicates
        @used_paths ||= []
        new_paths = paths - @used_paths
        @used_paths += new_paths
        new_paths
      else
        paths
      end
    end
  
    def webpack_public_host
        ActionController::Base.asset_host.try(:chomp, '/')
    end

    private

    def entrypoint_paths(source)
        raise StandardError, manifest["errors"] unless manifest_bundled?
        
        entrypoint = manifest["entrypoints"][source]
        if entrypoint && entrypoint["assets"]
          # Can be either a string or an array of strings.
          # Do not include source maps as they are not javascript
          [entrypoint["assets"]].flatten.reject { |p| p =~ /.*\.map$/ }.map do |p|
            "/assets/webpack/#{p}"
          end
        else
          raise StandardError, "Can't find asset '#{source}' in webpack manifest"
        end
    end

    def asset_paths(source)
        raise StandardError, manifest["errors"] unless manifest_bundled?

        paths = manifest["assetsByChunkName"][source]
        if paths
          # Can be either a string or an array of strings.
          # Do not include source maps as they are not javascript
          [paths].flatten.reject { |p| p =~ /.*\.map$/ }.map do |p|
            "/assets/webpack/#{p}"
          end
        else
          raise StandardError, "Can't find entry point '#{source}' in webpack manifest"
        end
    end

    def manifest_bundled?
        !manifest["errors"].any? { |error| error.include? "Module build failed" }
    end

    def manifest
        load_manifest
    end

    def load_from_static(path)
        file_uri = ::Rails.root.join(
          'public/assets/webpack',
          path
        )

        File.read(file_uri)
    end

    def load_manifest
        datas = load_from_static('manifest.json')
        JSON.parse(datas)
    end
  end
  